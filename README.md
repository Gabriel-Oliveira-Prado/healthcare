# Healthcare

Portal de saúde desenvolvido com React, TypeScript, Vite, Bootstrap e uma API Node.js.

## Problema e objetivo

O Healthcare reúne em uma interface serviços e informações básicas de saúde para o cidadão, como agendamentos demonstrativos, campanhas, localização de unidades e orientações.

## Funcionalidades

- Cadastro de usuário com validação de nome, e-mail e senha.
- Login com senha protegida por hash e sessão de servidor em cookie HttpOnly.
- Recuperação de senha com código numérico enviado ao e-mail cadastrado.
- Código de recuperação com validade de 15 minutos, uso único e limite de cinco tentativas.
- Logout e proteção de páginas privadas.
- Conteúdo demonstrativo de agendamentos, campanhas e orientações.
- Mapa de unidades, farmácias e hospitais com OpenStreetMap e Overpass API.

## Tecnologias

React 19, TypeScript, Vite, Bootstrap, Node.js (HTTP nativo), scrypt, cookies HttpOnly e Resend para envio de e-mail.

## Como executar

Requer Node.js 20+ e npm.

```bash
npm install
npm run dev
```

O comando inicia o front-end Vite em `http://localhost:5173` e a API em `http://127.0.0.1:3001`. A API é necessária para cadastro, login e recuperação de senha.

## Configurar o envio de e-mail

A recuperação usa o serviço Resend, sem biblioteca adicional. Para enviar e-mails reais:

1. Crie uma conta em [Resend](https://resend.com/).
2. Cadastre e verifique um domínio de envio no Resend.
3. Crie uma API Key.
4. Configure as variáveis de ambiente antes de iniciar `npm run dev`:

PowerShell (Windows):

```powershell
$env:RESEND_API_KEY="re_sua_chave"
$env:EMAIL_FROM="Healthcare <no-reply@seudominio.com>"
npm run dev
```

Linux/macOS:

```bash
export RESEND_API_KEY="re_sua_chave"
export EMAIL_FROM="Healthcare <no-reply@seudominio.com>"
npm run dev
```

Use como `EMAIL_FROM` um remetente permitido pelo domínio verificado no Resend. **Não coloque a API Key no código, no front-end ou no GitHub.** Sem essas duas variáveis, a API informa que o envio não está configurado e não finge que o e-mail foi enviado.

O endpoint de recuperação responde da mesma forma para e-mails cadastrados e não cadastrados, para não revelar quais contas existem. Se o endereço estiver cadastrado, o código é enviado por e-mail. Confira também a pasta de spam.

## Endpoints da API

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| POST | `/api/register` | Criar uma conta |
| POST | `/api/login` | Autenticar e criar sessão |
| GET | `/api/me` | Consultar sessão atual |
| POST | `/api/logout` | Encerrar sessão |
| POST | `/api/forgot-password` | Enviar código de recuperação |
| POST | `/api/reset-password` | Validar código e alterar senha |

As rotas POST exigem requisição JSON da mesma origem. As senhas e códigos de recuperação são armazenados apenas como hashes scrypt. As sessões usam cookie HttpOnly, SameSite=Strict e validade de oito horas. Em produção, publique sempre com HTTPS.

A lista de sessões e códigos de recuperação fica na memória do processo: reiniciar o servidor encerra as sessões e invalida códigos pendentes. Para um sistema de produção, use armazenamento persistente e um provedor de sessão apropriado.

## Testes e build

```bash
npm run test:api
npm test
npm run build
```

## Integrantes

- Gabriel Oliveira
- Marcelo Justino
- Pedro Henrique Canto Bezerra
- Carlos Henrique

Planejamento: [quadro do Trello](https://trello.com/b/KRnf6XEe/trabalho-uninassau). Repositório: [GitHub](https://github.com/Gabriel-Oliveira-Prado/healthcare).

## Limites do MVP

Os agendamentos, campanhas e orientações ainda são demonstrativos, sem integração com unidades de saúde. O mapa depende dos serviços públicos OpenStreetMap/Overpass e pode apresentar dados incompletos ou desatualizados. O projeto é acadêmico e não substitui sistemas de saúde ou atendimento profissional.
