# Agenda do Thomaz

Aplicativo familiar visual para organizar tarefas escolares, provas, materiais, eventos e atividades extracurriculares do Thomaz.

## Objetivos

- Reduzir esquecimentos e sobrecarga para uma família com TDAH.
- Transformar mensagens da Agenda Edu em ações objetivas.
- Exibir tarefas por cor, ícone, prioridade e prazo.
- Permitir checklists compartilhados.
- Integrar futuramente Gmail, Google Calendar e login Google.
- Enviar lembretes de preparativos, provas e materiais.

## Estado atual

MVP estático e instalável como PWA, com:

- painel Hoje;
- checklists persistidos no navegador;
- classificação visual por tipo;
- contagem regressiva;
- avatares da família;
- visão semanal, provas e família;
- inclusão manual de tarefas;
- modo demonstração;
- estrutura preparada para autenticação e sincronização.

## Executar localmente

Abra `index.html` com uma extensão de servidor local, como Live Server, ou execute:

```bash
npx serve .
```

## Publicação

O projeto é compatível com deploy estático no Netlify.

## Próximas integrações

1. Firebase Authentication com Google.
2. Firestore para sincronização entre aparelhos.
3. Google Calendar da família.
4. Leitura estruturada dos e-mails da Agenda Edu.
5. Push notifications confiáveis no celular.

## Privacidade

Não salvar credenciais, tokens ou dados escolares sensíveis diretamente no repositório.