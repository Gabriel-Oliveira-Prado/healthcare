export default function Appointments() {
  return <div className="portal-page">
    <div className="portal-page-heading"><span className="portal-eyebrow">CUIDADO NO SEU TEMPO</span><h1>Agendamentos</h1><p>Encontre consultas e exames nos postos de saúde.</p></div>
    <div className="portal-panel appointment-page-panel">
      <div className="panel-title"><span className="panel-icon"><i className="bi bi-calendar2-check" aria-hidden="true" /></span><div><h2>Agendar atendimento</h2><p>Selecione as opções para consultar a disponibilidade.</p></div></div>
      <div className="appointment-steps"><span className="current">1. Serviço</span><span>2. Unidade</span><span>3. Data</span></div>
      <form onSubmit={event => event.preventDefault()}><div className="row g-3"><div className="col-md-6"><label className="form-label" htmlFor="appointment-type">Tipo de atendimento</label><select className="form-select" id="appointment-type"><option>Consulta</option><option>Exame</option></select></div><div className="col-md-6"><label className="form-label" htmlFor="appointment-specialty">Especialidade ou exame</label><select className="form-select" id="appointment-specialty"><option>Selecione uma opção</option><option>Clínica geral</option><option>Odontologia</option></select></div><div className="col-md-6"><label className="form-label" htmlFor="appointment-unit">Posto de saúde</label><select className="form-select" id="appointment-unit"><option>Selecione uma unidade</option></select></div><div className="col-md-6"><label className="form-label" htmlFor="appointment-date">Data desejada</label><input className="form-control" id="appointment-date" type="date" /></div></div><div className="panel-actions"><span>Esta tela demonstra o fluxo visual; nenhum horário é consultado.</span><button type="submit" className="btn portal-primary-button">Ver horários <i className="bi bi-arrow-right" aria-hidden="true" /></button></div></form>
    </div>
  </div>
}
