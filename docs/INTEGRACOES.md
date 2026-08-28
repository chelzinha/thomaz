# Integrações da Agenda do Thomaz

## 1. Login Google

Arquitetura recomendada:

- Firebase Authentication com provedor Google.
- Lista de e-mails autorizados em uma coleção `familyMembers`.
- Perfis: `adult`, `child` e `viewer`.
- Thomaz acessa uma interface simplificada sem configurações administrativas.

## 2. Sincronização entre aparelhos

Usar Firestore para armazenar:

- tarefas;
- provas;
- eventos;
- responsáveis;
- status de conclusão;
- pedidos de ajuda;
- preferências visuais;
- histórico de alterações.

Coleções sugeridas:

```text
families/{familyId}
familyMembers/{memberId}
tasks/{taskId}
events/{eventId}
reminders/{reminderId}
imports/{importId}
```

## 3. Google Calendar

O calendário familiar deve fornecer:

- dias na casa da mãe;
- dias na casa do pai;
- consultas;
- atividades extracurriculares;
- eventos da escola;
- lembretes de materiais e roupas.

Permissões mínimas:

- leitura dos calendários autorizados;
- criação e atualização somente no calendário específico da família.

Não solicitar acesso a todos os calendários quando não for necessário.

## 4. Agenda Edu pelo Gmail

Fluxo recomendado:

```text
Agenda Edu
  -> Gmail
  -> Apps Script ou função agendada
  -> parser e deduplicação
  -> Firestore
  -> aplicativo
```

Regras do parser:

1. Filtrar remetente `no-reply@contato.agendaedu.com`.
2. Considerar somente mensagens relacionadas ao Thomaz.
3. Ler o corpo completo do e-mail.
4. Separar tarefa, prova, material, evento e comunicado.
5. Extrair disciplina, páginas, prazo, horário, roupa e links.
6. Eliminar conteúdo duplicado por hash e identificador da mensagem.
7. Manter o texto original disponível para conferência do adulto.
8. Nunca marcar e-mails como lidos automaticamente na primeira versão.

## 5. Lembretes

Para lembretes confiáveis no iPhone, combinar:

- notificações do Google Calendar;
- push notifications via Firebase Cloud Messaging;
- resumo diário para o adulto responsável;
- lembretes antecipados para materiais e preparativos.

Exemplos:

- 20h do dia anterior: separar uniforme ou material.
- 7h do dia: conferir mochila.
- três dias antes: iniciar estudo para prova.
- uma hora antes: atividade extracurricular.

## 6. Segurança

- Não colocar credenciais no repositório.
- Restringir acesso pelo e-mail Google autorizado.
- Usar regras do Firestore por `familyId`.
- Não publicar textos escolares em páginas públicas.
- Registrar alterações feitas por adultos.
- Limitar dados exibidos no modo infantil.

## 7. Etapas de implementação

1. Publicar o MVP estático no Netlify.
2. Criar projeto Firebase.
3. Ativar login Google.
4. Migrar `localStorage` para Firestore.
5. Conectar Google Calendar.
6. Criar importador da Agenda Edu.
7. Ativar notificações push.
8. Testar em iPhone, tablet e computador.
