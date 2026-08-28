# Agenda do Thomaz

Aplicativo familiar visual para organizar tarefas escolares, provas, materiais, eventos e atividades extracurriculares do Thomaz.

Site: `https://agenda-thomaz.netlify.app`

## Objetivos

- Reduzir esquecimentos e sobrecarga para uma família com TDAH.
- Transformar mensagens da Agenda Edu em ações objetivas.
- Exibir tarefas por cor, ícone, prioridade e prazo.
- Permitir checklists compartilhados.
- Integrar Google Calendar e login Google.
- Enviar lembretes de preparativos, provas e materiais.

## Recursos atuais

- painel Hoje com foco no próximo passo;
- checklists e pedido de ajuda;
- classificação visual por tipo;
- contagem regressiva para provas e eventos;
- avatares da família;
- visão semanal, provas e agenda familiar;
- inclusão manual de tarefas;
- modo foco e redução de estímulos;
- PWA instalável e funcionamento offline;
- login Google preparado com Firebase Authentication;
- sincronização compartilhada preparada com Firestore;
- autorização de familiares por e-mail;
- importação do calendário Google `Filhos`;
- leitura dos períodos na casa do pai a partir dos eventos `Fábio`;
- criação de lembretes no Google Agenda com avisos de 24 horas e 2 horas;
- modo local preservado quando a nuvem não estiver configurada ou disponível.

## Arquitetura

```text
Agenda Edu / entrada manual
          ↓
     Agenda do Thomaz
          ↓
Firebase Authentication + Firestore
          ↓
Google Calendar + lembretes no celular
```

A aplicação principal continua em JavaScript puro. `bridge.js` expõe uma interface segura entre o estado local e `cloud.js`, mantendo o aplicativo utilizável mesmo sem conexão.

## Executar localmente

```bash
npm run build
npx serve .
```

O build gera `runtime-config.js` a partir das variáveis de ambiente.

## Ativar Firebase

Consulte [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md).

As regras do banco estão em [`firestore.rules`](firestore.rules).

## Publicação

O Netlify executa:

```bash
npm run build
```

A pasta publicada é a raiz do repositório.

## Próxima integração

A etapa seguinte é automatizar a leitura dos e-mails da Agenda Edu e gravar tarefas estruturadas no banco familiar, com deduplicação por mensagem e separação entre tarefa, prova, material e comunicado.

## Privacidade

- Não salvar tokens, chaves privadas ou contas de serviço no repositório.
- O acesso ao Firestore depende do login Google e das regras em `firestore.rules`.
- Apenas Rachel pode iniciar a família e autorizar novos e-mails.
- O modo local armazena os dados somente no navegador utilizado.
