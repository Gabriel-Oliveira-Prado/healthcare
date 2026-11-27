import { normalizeEmail, validateEmail, validateName, validatePassword, validateRecoveryCode } from './validation'
export type User = { id: string; name: string; email: string }
export type AuthField = 'name' | 'email' | 'password' | 'code'
const KEY = 'healthcare.session.user'
export class AuthError extends Error {
 field?: AuthField
 constructor(message: string, field?: AuthField) { super(message); this.name='AuthError'; this.field=field }
}
function cache(user: User | null) { if(user) localStorage.setItem(KEY,JSON.stringify(user)); else localStorage.removeItem(KEY) }
export function getCurrentUser(): User | null { try { const v=localStorage.getItem(KEY); return v?JSON.parse(v):null } catch { return null } }
async function api<T>(path:string, body?:unknown):Promise<T> {
 let response:Response
 try { response=await fetch(path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}) }
 catch { throw new AuthError('Não foi possível conectar ao servidor. Verifique se a API está em execução.') }
 const data=await response.json().catch(()=>({})) as {error?:string}
 if(!response.ok) throw new AuthError(data.error||'Não foi possível concluir a solicitação.')
 return data as T
}
export async function register(input:{name:string;email:string;password:string}):Promise<User>{
 const name=input.name.trim().replace(/\s+/g,' '),email=normalizeEmail(input.email)
 const ne=validateName(name),ee=validateEmail(email),pe=validatePassword(input.password)
 if(ne) throw new AuthError(ne,'name'); if(ee) throw new AuthError(ee,'email'); if(pe) throw new AuthError(pe,'password')
 return (await api<{user:User}>('/api/register',{name,email,password:input.password})).user
}
export async function login(email:string,password:string):Promise<User>{
 const normalized=normalizeEmail(email),error=validateEmail(normalized); if(error) throw new AuthError(error,'email')
 const user=(await api<{user:User}>('/api/login',{email:normalized,password})).user; cache(user); return user
}
export async function refreshSession():Promise<User|null>{ try{const user=(await api<{user:User}>('/api/me')).user;cache(user);return user}catch{cache(null);return null} }
export async function logout():Promise<void>{try{await api('/api/logout',{})}finally{cache(null)}}
export async function requestPasswordReset(email:string):Promise<void>{const normalized=normalizeEmail(email),error=validateEmail(normalized);if(error)throw new AuthError(error,'email');await api('/api/forgot-password',{email:normalized})}
export async function resetPassword(input:{email:string;code:string;newPassword:string}):Promise<void>{
 const ce=validateRecoveryCode(input.code),pe=validatePassword(input.newPassword);if(ce)throw new AuthError(ce,'code');if(pe)throw new AuthError(pe,'password')
 await api('/api/reset-password',{email:normalizeEmail(input.email),code:input.code.trim(),newPassword:input.newPassword})
}
