# Ativação do Firebase e Google Agenda

A Agenda do Thomaz funciona em modo local sem Firebase. Esta configuração ativa login Google, compartilhamento entre aparelhos e sincronização com o calendário `Filhos`.

## 1. Criar o projeto Firebase

1. Acesse o Firebase Console com `chelzinha@gmail.com`.
2. Crie um projeto chamado `Agenda do Thomaz`.
3. O Google Analytics é opcional para este aplicativo.
4. No painel do projeto, adicione um aplicativo Web.
5. Use o apelido `agenda-thomaz`.
6. Copie o objeto de configuração exibido pelo Firebase.

## 2. Ativar login Google

1. Abra **Authentication**.
2. Em **Sign-in method**, ative **Google**.
3. Defina `chelzinha@gmail.com` como e-mail de suporte.
4. Em **Settings > Authorized domains**, inclua:
   - `agenda-thomaz.netlify.app`
   - `localhost`, apenas para testes locais

## 3. Criar o Firestore

1. Abra **Firestore Database**.
2. Crie o banco em modo de produção.
3. Escolha uma região adequada para usuários no Brasil.
4. Abra a aba **Rules**.
5. Substitua as regras pelo conteúdo do arquivo `firestore.rules` deste repositório.
6. Publique as regras.

A primeira entrada com `chelzinha@gmail.com` cria a família e registra Rachel como administradora. Nenhum outro e-mail recebe acesso automaticamente.

## 4. Ativar Google Calendar API

1. Abra o projeto correspondente no Google Cloud Console.
2. Entre em **APIs e serviços > Biblioteca**.
3. Ative **Google Calendar API**.
4. Verifique a tela de consentimento OAuth.
5. Durante os testes, adicione os familiares como usuários de teste, caso o aplicativo ainda esteja em modo de teste.

O aplicativo solicita apenas os escopos necessários para listar calendários e ler ou criar eventos.

## 5. Cadastrar variáveis no Netlify

No projeto `agenda-thomaz`, abra **Project configuration > Environment variables** e cadastre as informações copiadas do objeto Firebase:

| Variável Netlify | Campo Firebase |
|---|---|
| `FIREBASE_API_KEY` | `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `FIREBASE_PROJECT_ID` | `projectId` |
| `FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `FIREBASE_APP_ID` | `appId` |

Estas variáveis já estão configuradas:

- `AGENDA_ADMIN_EMAIL=chelzinha@gmail.com`
- `AGENDA_FAMILY_ID=thomaz-family`
- `GOOGLE_CALENDAR_ID=9f6c20fbf4f23efc223d60b2fd64bbf056bb3fe85379e24e5f6912421f9d3554@group.calendar.google.com`

As variáveis devem ter escopo de **Builds**. Depois de adicioná-las, execute um novo deploy.

## 6. Primeiro acesso

1. Abra `https://agenda-thomaz.netlify.app`.
2. Entre em **Ajustes**.
3. Clique em **Entrar com Google**.
4. Use `chelzinha@gmail.com` no primeiro acesso.
5. O aplicativo enviará os dados locais atuais para o Firestore.
6. Em **Família conectada**, autorize os e-mails dos demais familiares.
7. Cada familiar entra com o próprio Google.

## 7. Google Agenda e lembretes

- **Ler Google Agenda** importa os eventos do calendário `Filhos`.
- Eventos como `Fábio` são usados para indicar os dias na casa do pai.
- **Criar lembretes** envia preparativos pendentes para o Google Agenda.
- Cada novo lembrete recebe avisos de 24 horas e 2 horas antes.

## Segurança

- Nunca adicione chave privada de conta de serviço ao GitHub ou ao JavaScript do navegador.
- A configuração Web do Firebase é pública por natureza. A proteção real é feita pelo Authentication e pelas regras do Firestore.
- Não use regras de teste liberadas para qualquer pessoa.
