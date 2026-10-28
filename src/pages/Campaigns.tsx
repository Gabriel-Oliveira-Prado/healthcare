const notices = [
  { icon: 'bi-bandaid', category: 'VACINAÇÃO', title: 'Campanhas de vacinação', description: 'Acompanhe comunicados sobre campanhas e orientações divulgadas para a sua região.', tone: 'green' },
  { icon: 'bi-shield-plus', category: 'PREVENÇÃO', title: 'Ações de prevenção', description: 'Veja avisos sobre atividades e iniciativas de cuidado nos serviços de saúde.', tone: 'coral' },
]

export default function Campaigns() {
  return <div className="portal-page">
    <div className="portal-page-heading"><span className="portal-eyebrow">FIQUE POR DENTRO</span><h1>Campanhas e avisos</h1><p>Um espaço para informações sobre vacinação e prevenção.</p></div>
    <div className="row g-3">{notices.map(notice => <div className="col-lg-6" key={notice.title}><article className="notice-card"><span className={`notice-icon ${notice.tone}`}><i className={`bi ${notice.icon}`} aria-hidden="true" /></span><span className="notice-category">{notice.category}</span><h2>{notice.title}</h2><p>{notice.description}</p></article></div>)}</div>
  </div>
}
