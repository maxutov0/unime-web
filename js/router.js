import { parseHash } from './utils.js';

export class Router {
  constructor(routes){
    this.routes = routes; // array of { path, match, render }
    addEventListener('hashchange', () => this.resolve());
  }

  resolve(){
    const { path, segments, query } = parseHash();
    for(const r of this.routes){
      const params = r.match(segments);
      if(params){
        return r.render({ params, query });
      }
    }
    const nf = this.routes.find(r => r.path === '#/not-found');
    if(nf) nf.render({ params:{}, query:{} });
  }
}

export function path(pathPattern, render){
  const cleaned = pathPattern.replace(/^#?\//, '');
  const parts = cleaned.split('/').filter(Boolean);
  const isWildcard = pathPattern.endsWith('*');
  return {
    path: `#/${parts.join('/')}`,
    match(segments){
      if(isWildcard) return {};
      if(parts.length !== segments.length) return null;
      const params = {};
      for(let i=0;i<parts.length;i++){
        const p = parts[i]; const s = segments[i];
        if(p.startsWith(':')) params[p.slice(1)] = s;
        else if(p !== s) return null;
      }
      return params;
    },
    render
  };
}
