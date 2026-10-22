import { Link, useParams } from "react-router-dom";
import { useCatalog } from "@/components/CatalogContext";
export function Methods() {
  const data = useCatalog();
  return (
    <div className="workspace-page">
      <p className="eyebrow">Подход к работе</p>
      <h1>Методологии</h1>
      <p className="lede">
        Выберите метод по вопросу. Метод задаёт способ рассуждения; сведения о
        проекте берутся из источников базы.
      </p>
      {!data ? (
        <p>Загрузка методологий…</p>
      ) : !data.methods?.length ? (
        <p>
          Методологии ещё не подключены. Добавьте карточку и запись в реестр
          проекта.
        </p>
      ) : (
        data.methods.map((m) => (
          <article className="publication-card" key={m.id}>
            <p className="eyebrow">{m.lens}</p>
            <h2>
              <Link to={"/doc/" + m.card}>{m.title}</Link>
            </h2>
            <p>{m.question}</p>
            {m.mode === "reference" && (
              <p>
                Канон доступен по ссылке на закреплённую редакцию. Локальной
                копии нет.
              </p>
            )}
            <p>
              <a href={m.source} target="_blank" rel="noreferrer">
                Читать канон
              </a>{" "}
              · Условия первоисточника: {m.license}
              {m.revision && " · Редакция: " + m.revision}
            </p>
          </article>
        ))
      )}
    </div>
  );
}
export function Research() {
  const { id } = useParams();
  const data = useCatalog();
  const topics = (data?.research ?? []).filter((t) => !id || t.id === id);
  return (
    <div className="workspace-page">
      <p className="eyebrow">Темы и результаты</p>
      <h1>{id ? topics[0]?.title || "Тема не найдена" : "Исследования"}</h1>
      <p className="lede">
        Вопрос, состояние работы и опубликованные результаты.
      </p>
      {!data ? (
        <p>Загрузка исследований…</p>
      ) : !topics.length ? (
        <p>Исследований пока нет.</p>
      ) : (
        topics.map((t) => (
          <article className="publication-card" key={t.id}>
            <h2>
              {id ? t.title : <Link to={"/research/" + t.id}>{t.title}</Link>}
            </h2>
            <p>{t.question}</p>
            {t.status && <p>Статус: {t.status}</p>}
            {t.results.map((path) => (
              <p key={path}>
                <Link to={"/doc/" + path}>
                  {data.docs.find((d) => d.path === path)?.title || path}
                </Link>
              </p>
            ))}
          </article>
        ))
      )}
    </div>
  );
}
