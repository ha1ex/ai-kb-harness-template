import type {Catalog,SearchResponse} from './api';
export function searchDocuments(dependencies:{staticMode:boolean;fetchJson:(url:string)=>Promise<SearchResponse>;getCatalog:()=>Promise<Catalog>},q:string,mode?:string,top?:number):Promise<SearchResponse>;
