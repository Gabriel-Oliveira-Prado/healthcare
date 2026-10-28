import Brand from '../components/Brand'
import Home from './Home'
import Appointments from './Appointments'
import Campaigns from './Campaigns'
import Units from './Units'
import Guidance from './Guidance'
import './portal.css'

export type PortalSection = 'inicio' | 'agendamentos' | 'campanhas' | 'unidades' | 'orientacoes'

const menu: { id: PortalSection, label: string, icon: string }[] = [
  { id: 'inicio', label: 'Início', icon: 'bi-grid-1x2' },
  { id: 'agendamentos', label: 'Agendamentos', icon: 'bi-calendar2-check' },
  { id: 'campanhas', label: 'Campanhas', icon: 'bi-bell' },
  { id: 'unidades', label: 'Unidades próximas', icon: 'bi-geo-alt' },
  { id: 'orientacoes', label: 'Orientações', icon: 'bi-chat-heart' },
]

const screens = {
  inicio: Home,
  agendamentos: Appointments,
  campanhas: Campaigns,
  unidades: Units,
  orientacoes: Guidance,
}

export default function Portal({ page }: { page: PortalSection }) {
  const Screen = screens[page]
  return <div className="portal-shell">
    <aside className="portal-sidebar d-none d-lg-flex flex-column" aria-label="Menu do portal">
      <Brand light className="portal-sidebar-brand" />
      <p className="portal-sidebar-caption">PORTAL DE SAÚDE</p>
      <nav className="portal-side-nav">{menu.map(item => <a key={item.id} href={`#/${item.id}`} className={page === item.id ? 'active' : ''} aria-current={page === item.id ? 'page' : undefined}><i className={`bi ${item.icon}`} aria-hidden="true" />{item.label}</a>)}</nav>
      <div className="mt-auto px-2"><a href="#/logout" className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2"><i className="bi bi-box-arrow-left" aria-hidden="true" /> Sair da conta</a></div>
    </aside>
    <div className="portal-workspace">
      <header className="portal-topbar"><div className="d-lg-none"><Brand /></div><span className="portal-topbar-title d-none d-lg-inline">Healthcare · Seu portal de saúde</span><a href="#/logout" className="portal-mobile-exit d-lg-none text-danger ms-auto" aria-label="Sair"><i className="bi bi-box-arrow-right" /></a></header>
      <nav className="portal-mobile-nav d-lg-none" aria-label="Seções do portal">{menu.map(item => <a key={item.id} href={`#/${item.id}`} className={page === item.id ? 'active' : ''}>{item.label}</a>)}</nav>
      <main className="portal-main"><Screen /></main>
      <footer className="portal-footer">© 2026 Healthcare.</footer>
    </div>
  </div>
}
