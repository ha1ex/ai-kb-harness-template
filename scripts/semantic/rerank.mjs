// rerank.mjs — опциональная cross-encoder rerank-стадия поверх RRF-выдачи.
//
// Зеркалит reranker-слой Hindsight (cross-encoder/ms-marco-MiniLM-L-6-v2). Кросс-энкодер
// смотрит на пару (запрос, чанк) ЦЕЛИКОМ и даёт скаляр релевантности — точнее, чем
// bi-encoder (e5) + RRF, которые оценивают запрос и чанк по отдельности. Цена: +модель ~90 MB
// и инференс пары на каждый кандидат, поэтому стадия OPT-IN (флаг --rerank / KB_RERANK=1) и
// включается в дефолт только если eval (recall@k / MRR) растёт — см. scripts/semantic/eval.mjs.
//
// On-device, та же инфраструктура @xenova/transformers, что и эмбеддер. Без сети после
// первой загрузки модели в .transformers-cache. Деградирует мягко: если модель не грузится
// (нет сети на первом прогоне) — возвращает исходный порядок и пишет предупреждение в stderr.

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AutoTokenizer, AutoModelForSequenceClassification, env } from '@xenova/transformers';

const here = fileURLToPath(new URL('.', import.meta.url));
env.cacheDir = resolve(here, '.transformers-cache');
env.allowLocalModels = true;
env.useBrowserCache = false;

export const RERANK_MODEL = 'Xenova/ms-marco-MiniLM-L-6-v2';

let _reranker = null;
let _failed = false;

/**
 * Singleton cross-encoder. Возвращает функцию score(query, passages[]) → number[] (логиты
 * релевантности, больше = релевантнее). При ошибке загрузки возвращает null (мягкая деградация).
 */
export async function createReranker() {
  if (_reranker) return _reranker;
  if (_failed) return null;
  try {
    const tokenizer = await AutoTokenizer.from_pretrained(RERANK_MODEL);
    const model = await AutoModelForSequenceClassification.from_pretrained(RERANK_MODEL, { quantized: true });
    _reranker = async (query, passages) => {
      if (!passages.length) return [];
      // Кросс-энкодер: пара (query, passage). ms-marco-MiniLM выдаёт 1 логит на пару.
      const inputs = tokenizer(new Array(passages.length).fill(query), {
        text_pair: passages,
        padding: true,
        truncation: true,
      });
      const { logits } = await model(inputs);
      const data = logits.data;          // [N] или [N,1]
      return Array.from({ length: passages.length }, (_, i) => Number(data[i]));
    };
    return _reranker;
  } catch (e) {
    _failed = true;
    console.error(`[rerank] не удалось загрузить ${RERANK_MODEL}: ${e && e.message}. Стадия пропущена (исходный порядок).`);
    return null;
  }
}

/**
 * Переранжирует топ-N результатов кросс-энкодером и реинтегрирует хвост.
 * Мутирует/возвращает новый массив; каждому переранжированному элементу проставляет rerank_score.
 * topN — сколько верхних кандидатов прогонять через кросс-энкодер (default 20): глубже редко нужно,
 * а инференс линеен по числу пар. Хвост за topN остаётся в исходном порядке после переранжированных.
 */
export async function rerank(query, results, { topN = 20 } = {}) {
  if (!results || results.length < 2) return results;
  const reranker = await createReranker();
  if (!reranker) return results;                       // деградация → исходный порядок

  const head = results.slice(0, topN);
  const tail = results.slice(topN);
  const passages = head.map((r) => (r.text || '').slice(0, 512));
  const scores = await reranker(query, passages);

  const scored = head.map((r, i) => ({ ...r, rerank_score: Number(scores[i].toFixed(4)) }));
  scored.sort((a, b) => b.rerank_score - a.rerank_score);
  return scored.concat(tail);
}
