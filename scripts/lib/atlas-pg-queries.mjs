// PostgreSQL-native query adapter for legacy statement-shaped command-line logic.
// Queries are asynchronous and execute on the authoritative PostgreSQL schema.
// No SQLite database, file cache, replication layer or row mirroring is involved.
function pgPlaceholders(statement) {
  let index=0,quoted=false,quotedIdentifier=false,output='';
  for(let i=0;i<statement.length;i++){
    const char=statement[i];
    if(char==="'"&&!quotedIdentifier){
      if(quoted&&statement[i+1]==="'"){output+="''";i++;continue;}
      quoted=!quoted;
    }else if(char==='"'&&!quoted) quotedIdentifier=!quotedIdentifier;
    if(char==='?'&&!quoted&&!quotedIdentifier)output+='$'+(++index);
    else output+=char;
  }
  return output;
}
export function pgStatement(source) {
  let sql=String(source).trim();
  if(/^PRAGMA\b/i.test(sql))throw new Error('PRAGMA is not supported by PostgreSQL');
  if(/^BEGIN IMMEDIATE$/i.test(sql))return 'BEGIN';
  sql=sql.replace(/(\w+(?:\.\w+)?)\s+IS\s+NOT\s+(excluded\.\w+)/gi,'$1 IS DISTINCT FROM $2');
  const ignore=/^\s*INSERT\s+OR\s+IGNORE\s+INTO\s+/i.test(sql);
  sql=sql.replace(/^\s*INSERT\s+OR\s+IGNORE\s+INTO\s+/i,'INSERT INTO ');
  if(ignore)sql=sql.replace(/;?\s*$/,' ON CONFLICT DO NOTHING');
  return pgPlaceholders(sql);
}
const camelAliases={verifiedpatterns:'verifiedPatterns',patterncount:'patternCount',unverifieditems:'unverifiedItems',itemcount:'itemCount',checkedat:'checkedAt',observedat:'observedAt',patternurl:'patternUrl',patternstatus:'patternStatus',urltemplate:'urlTemplate',slugprefix:'slugPrefix',httpstatus:'httpStatus',sourceurl:'sourceUrl',nextcursor:'nextCursor'};
const integerColumns=new Set(['n','id','pattern_id','attempts','http_status','verifiedpatterns','patterncount','unverifieditems','itemcount','verifiedPatterns','patternCount','unverifiedItems','itemCount']);
function normalizeRows(rows) {
  return rows.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>{
    const fixed=camelAliases[key]??key;
    return [fixed,typeof value==='string'&&integerColumns.has(fixed)&&Number.isSafeInteger(Number(value))?Number(value):value];
  })));
}
export function attachLegacyQueries(sql) {
  const ready=sql.unsafe('SET search_path TO atlas, public');
  sql.prepare=source=>{
    const statement=pgStatement(source);
    const call=async params=>{await ready;if(!statement)return [];const result=await sql.unsafe(statement,params);const rows=normalizeRows(result);rows.count=result.count;return rows;};
    return {
      all:(...params)=>call(params),
      get:async(...params)=>(await call(params))[0],
      run:async(...params)=>{
        const r=await call(params);
        return {changes:r.count??r.length,lastInsertRowid:r[0]?.id??null};
      }
    };
  };
  sql.exec=async text=>{
    await ready;
    const statement=pgStatement(text);
    if(!statement)return;
    return sql.unsafe(statement);
  };
  return sql;
}
