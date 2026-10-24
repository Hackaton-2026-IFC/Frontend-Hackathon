<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="legal-page">
    <div class="legal-top">
      <RouterLink to="/" class="legal-back">← Voltar ao Momentum</RouterLink>
      <span class="legal-tag">MOMENTUM · HACKATHON IFC 2026</span>
    </div>
    <article class="legal-content">
      <h1>Política de Privacidade</h1>
      <p class="legal-updated">Última atualização: 24 de outubro de 2026</p>
      <p>O Momentum é uma plataforma colaborativa de gerenciamento de projetos e tarefas criada no contexto do Hackathon 2026 do IFC. Esta política explica como a plataforma trata informações quando você utiliza seus recursos. O responsável e o canal de privacidade devem ser informados pela equipe mantenedora antes da disponibilização pública definitiva.</p>

      <section><h2>1. Dados que tratamos</h2>
        <p>No cadastro, tratamos nome, e-mail, nome de usuário, credencial de autenticação e, quando fornecida, foto de perfil. Senhas cadastradas diretamente no Momentum são armazenadas pelo mecanismo de hash do Django, e não em texto simples. No login com Google, recebemos identificador da Conta Google, nome, e-mail verificado e URL da foto de perfil. Não solicitamos a senha da sua Conta Google.</p>
        <p>Também tratamos o conteúdo que você insere: projetos, participantes, convites, tarefas, subtarefas, responsáveis, prioridades, prazos, dependências, comentários, histórico de atividades, notificações, eventos, notas, imagens, documentos, links e materiais de apoio.</p>
      </section>

      <section><h2>2. Para que usamos esses dados</h2>
        <p>Utilizamos essas informações para criar e administrar contas, autenticar usuários, controlar permissões, organizar o trabalho das equipes, disponibilizar calendários, registrar atividades, apresentar notificações e oferecer análises de planejamento. Certas operações dependem de informações técnicas necessárias à comunicação entre navegador e servidor.</p>
      </section>

      <section><h2>3. Compartilhamento dentro dos projetos</h2>
        <p>Participantes autorizados podem visualizar informações compartilhadas do mesmo projeto, incluindo tarefas, responsáveis, comentários, atividades, calendário, ideias e recursos. A visibilidade é controlada pelas permissões implementadas no backend. A fixação e a ordem das ideias no mural são preferências individuais; outros participantes podem organizá-las de maneira diferente.</p>
      </section>

      <section><h2>4. Login e vinculação Google</h2>
        <p>Quando você entra com Google, o servidor valida a credencial perante o Google e cria uma sessão própria com tokens JWT. É possível vincular uma conta Google a uma conta Momentum existente mediante verificações de identidade. A autenticação Google não significa autorização automática para acessar o Google Agenda.</p>
      </section>

      <section><h2>5. Google Agenda</h2>
        <p>Quando você solicita exportar um evento, pedimos uma autorização OAuth específica com a permissão <code>https://www.googleapis.com/auth/calendar.events</code>. O Momentum encaminha ao Google as informações do evento selecionado, como título, descrição e horários. O servidor registra o identificador do evento criado, seu link, a data da exportação e o usuário que a realizou para evitar exportações repetidas. O token OAuth dessa operação não é armazenado permanentemente pelo fluxo de exportação implementado.</p>
        <p>A integração atual realiza exportação manual; alterações e exclusões posteriores no Momentum não são sincronizadas automaticamente com o Google Agenda. Você pode revogar o acesso em <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">Conexões da Conta Google</a>. A revogação não exclui automaticamente dados mantidos no Momentum.</p>
      </section>

      <section><h2>6. Inteligência artificial — Google Gemini</h2>
        <p>Ao usar o agente de IA de um projeto, a plataforma poderá enviar à API do Google Gemini nome e descrição do projeto, dados de tarefas, nomes e funções dos integrantes, responsáveis, prazos, urgência, dados meteorológicos quando aplicáveis, objetivo e ideias fornecidas, além de conteúdo de notas pessoais associadas àquele projeto. O backend aplica limites ao contexto enviado, mas isso não torna os dados anônimos.</p>
        <p>Essas informações são processadas pelo fornecedor para gerar sugestões. Evite inserir dados sigilosos ou desnecessários em solicitações à IA. Se a integração não estiver configurada ou falhar, o Momentum pode apresentar uma análise gerada localmente.</p>
      </section>

      <section><h2>7. Previsão do clima — Open-Meteo</h2>
        <p>Se você marcar que o clima influencia uma tarefa, o Momentum utiliza a localização textual informada (por exemplo, uma cidade) e a data prevista para consultar serviços da Open-Meteo. A resposta poderá conter previsão de temperatura, chuva e vento. A consulta não significa rastreamento contínuo da localização do dispositivo.</p>
      </section>

      <section><h2>8. Arquivos, infraestrutura e terceiros</h2>
        <p>Imagens e documentos enviados podem ser armazenados na infraestrutura do servidor ou no Cloudinary, conforme configuração do ambiente. Banco de dados e hospedagem são utilizados para operar a plataforma. Notificações podem ser encaminhadas por e-mail se o envio estiver configurado no servidor. Dados necessários a cada integração são compartilhados com os respectivos serviços — Google para autenticação e Agenda, Gemini para análise e Open-Meteo para previsão meteorológica.</p>
      </section>

      <section><h2>9. Segurança e conservação</h2>
        <p>O backend usa autenticação JWT, validações, verificações de participação em projetos e restrições de acesso. Em ambientes de produção configurados, utiliza conexões HTTPS e proteções adicionais. Nenhuma aplicação oferece segurança absoluta. Os prazos específicos de retenção e as rotinas de backup dependem da infraestrutura e das decisões dos responsáveis e ainda precisam ser formalizados publicamente.</p>
      </section>

      <section><h2>10. Direitos e exclusão</h2>
        <p>Você pode solicitar, nos termos da LGPD, informações sobre seus dados, correção e exclusão quando aplicável, bem como exercer outros direitos legais. A API atual não disponibiliza exclusão autônoma de conta pela interface; pedidos de exclusão e esclarecimentos devem ser encaminhados ao responsável pelo Momentum. A equipe precisa divulgar um canal de contato real antes de concluir o cadastro público no Google Cloud.</p>
      </section>

      <section><h2>11. Crianças e adolescentes</h2>
        <p>O tratamento de dados de crianças e adolescentes, quando aplicável, deve observar a LGPD e o melhor interesse desses titulares. A equipe responsável deverá definir regras de acesso compatíveis com o público do projeto.</p>
      </section>

      <section><h2>12. Alterações desta política</h2>
        <p>Este documento poderá ser atualizado em razão de novas funcionalidades e mudanças na operação do Momentum. Versões relevantes podem exigir novo aceite ao acessar a aplicação.</p>
      </section>

      <section><h2>13. Identificação e contato</h2>
        <p><strong>Aplicativo:</strong> Momentum — Hackathon IFC 2026.</p>
        <p><strong>Responsável e e-mail de privacidade:</strong> a definir e publicar pela equipe responsável antes da divulgação oficial do serviço.</p>
        <p><strong>Data:</strong> 24/10/2026.</p>
      </section>
    </article>
    <footer class="legal-bottom">
      <RouterLink to="/termos">Ler Termos de Uso</RouterLink>
      <RouterLink to="/">Página inicial</RouterLink>
    </footer>
  </main>
</template>

<style scoped>
.legal-page{min-height:100dvh;background:#f6f6f5;color:#171717;padding:clamp(16px,4vw,48px);font-family:inherit}.legal-top,.legal-bottom{max-width:940px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.legal-back,.legal-bottom a{font-size:13px;font-weight:700;text-decoration:underline}.legal-tag{font-size:11px;letter-spacing:1.5px;color:#777;font-weight:750}.legal-content{max-width:940px;margin:30px auto;background:white;border:1px solid #e6e6e6;border-radius:20px;padding:clamp(24px,5vw,56px);box-shadow:0 8px 30px #00000008}.legal-content h1{font-size:clamp(28px,4vw,40px);font-weight:800;line-height:1.1;letter-spacing:-1px}.legal-updated{font-size:12px;color:#666;margin:12px 0 25px}.legal-content section{border-top:1px solid #ececec;padding-top:22px;margin-top:24px}.legal-content h2{font-size:18px;font-weight:750;margin-bottom:10px}.legal-content p{margin-top:11px;font-size:14px;line-height:1.8;color:#414141}.legal-content code{word-break:break-all;background:#f3f3f3;padding:2px 4px}.legal-content a{color:#222;text-decoration:underline}.legal-bottom{padding:4px 0 24px}
</style>
