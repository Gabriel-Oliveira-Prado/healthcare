import { createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode } from 'react'
import * as service from './authService'
import type { User } from './authService'
type AuthValue={user:User|null;loading:boolean;login:(email:string,password:string)=>Promise<User>;logout:()=>void;refresh:()=>void}
const AuthContext=createContext<AuthValue|null>(null)
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true)
 const refresh=useCallback(()=>{setLoading(true);void service.refreshSession().then(setUser).finally(()=>setLoading(false))},[])
 const login=useCallback(async(email:string,password:string)=>{const u=await service.login(email,password);setUser(u);return u},[])
 const logout=useCallback(()=>{setUser(null);void service.logout()},[])
 useEffect(()=>{refresh();const listener=()=>refresh();window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener)},[refresh])
 const value=useMemo(()=>({user,loading,login,logout,refresh}),[user,loading,login,logout,refresh])
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth(){const context=useContext(AuthContext);if(!context)throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');return context}
