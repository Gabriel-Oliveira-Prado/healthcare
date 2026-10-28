const topics = [
  { icon: 'bi-plus-square', category: 'PRIMEIROS SOCORROS', title: 'Orientações para situações urgentes', description: 'Um espaço para conteúdos introdutórios e caminhos para encontrar atendimento quando necessário.', tags: ['Como se preparar', 'Quando pedir ajuda'], tone: 'green' },
  { icon: 'bi-chat-heart', category: 'SAÚDE MENTAL', title: 'Cuidar da mente também importa', description: 'Conteúdos de acolhimento e informações sobre onde buscar apoio profissional.', tags: ['Acolhimento', 'Rede de apoio'], tone: 'purple' },
]

export default function Guidance() {
  return <div className="portal-page">
    <div className="portal-page-heading"><span className="portal-eyebrow">ORIENTAÇÃO E CUIDADO</span><h1>Orientações de saúde</h1><p>Escolha um tema para explorar informações introdutórias.</p></div>
    <div className="row g-3">{topics.map(topic => <div className="col-lg-6" key={topic.title}><article className="guidance-topic"><span className={`guidance-topic-icon ${topic.tone}`}><i className={`bi ${topic.icon}`} aria-hidden="true" /></span><span className="notice-category">{topic.category}</span><h2>{topic.title}</h2><p>{topic.description}</p><div className="topic-tags">{topic.tags.map(tag => <span key={tag}>{tag}</span>)}</div></article></div>)}</div>
  </div>
}
