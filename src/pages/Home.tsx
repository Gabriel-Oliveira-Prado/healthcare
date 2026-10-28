const services = [
  { href: '#/agendamentos', icon: 'bi-calendar2-check', title: 'Agendamentos', description: 'Consultas e exames nos postos de saúde.' },
  { href: '#/campanhas', icon: 'bi-bell', title: 'Campanhas', description: 'Avisos de vacinação e prevenção.' },
  { href: '#/unidades', icon: 'bi-geo-alt', title: 'Unidades', description: 'Postos, farmácias e hospitais no mapa.' },
  { href: '#/orientacoes', icon: 'bi-chat-heart', title: 'Orientações', description: 'Primeiros socorros e saúde mental.' },
]

export default function Home() {
  return <div className="portal-page">
    <section className="home-hero" aria-label="Sua saúde mais perto de você">
      <picture><source media="(max-width: 640px)" srcSet="/images/healthcare-hero-mobile.svg" /><img src="/images/healthcare-hero.svg" alt="Healthcare para você. Sua saúde mais perto de você. Agende atendimentos, acompanhe campanhas e encontre serviços de saúde com facilidade." /></picture>
      <a className="btn portal-primary-button hero-action" href="#/agendamentos">Agendar atendimento <i className="bi bi-arrow-right" aria-hidden="true" /></a>
    </section>
    <div className="portal-section-heading"><span className="portal-eyebrow">SERVIÇOS</span><h1>O que você precisa hoje?</h1><p>Escolha uma área para continuar.</p></div>
    <div className="row g-3">{services.map(service => <div className="col-sm-6 col-xl-3" key={service.href}><a className="service-card" href={service.href}><span className="service-icon"><i className={`bi ${service.icon}`} aria-hidden="true" /></span><strong>{service.title}</strong><span>{service.description}</span><i className="bi bi-arrow-up-right service-arrow" aria-hidden="true" /></a></div>)}</div>
  </div>
}
