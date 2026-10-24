<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="terms-page">
    <div class="terms-container">
      <RouterLink to="/" class="terms-back">← Voltar ao Momentum</RouterLink>
      <article class="terms-article">
        <p class="terms-kicker">MOMENTUM · HACKATHON IFC 2026</p>
        <h1>Termos de Uso</h1>
        <p class="terms-date">Última atualização: 24 de outubro de 2026</p>
        <p>Estes termos descrevem as condições gerais de uso do Momentum, plataforma de gerenciamento colaborativo de projetos e tarefas desenvolvida no contexto do Hackathon 2026 do IFC.</p>

        <section><h2>1. Utilização da plataforma</h2>
          <p>O Momentum permite criar e participar de projetos, organizar tarefas e dependências, colaborar com comentários e murais, registrar eventos e acessar integrações opcionais. O usuário deve utilizar a plataforma de maneira lícita e respeitar os demais participantes.</p>
        </section>
        <section><h2>2. Conta e autenticação</h2>
          <p>É responsabilidade do usuário manter suas credenciais protegidas e fornecer informações de cadastro adequadas. O acesso pode ocorrer por autenticação tradicional ou login Google. Não compartilhe tokens, senhas nem utilize contas de terceiros sem autorização.</p>
        </section>
        <section><h2>3. Conteúdos e colaboração</h2>
          <p>O conteúdo inserido pelo usuário pode ser acessado por outros membros autorizados do projeto. O usuário é responsável pelos materiais, links, descrições, arquivos e comentários que adiciona. Não publique dados pessoais de terceiros, conteúdo ilícito ou informações confidenciais sem autorização.</p>
        </section>
        <section><h2>4. Integrações externas</h2>
          <p>O Google Agenda é opcional e exige autorização específica antes da exportação de eventos. As integrações de IA e clima dependem de serviços de terceiros, que podem apresentar indisponibilidade e estão sujeitos a suas próprias condições. A análise por IA e a previsão do tempo são auxiliares de planejamento, não garantias de resultados.</p>
        </section>
        <section><h2>5. Privacidade</h2>
          <p>O tratamento de dados pessoais e as finalidades de uso estão descritos na <RouterLink to="/privacidade">Política de Privacidade</RouterLink>, disponível publicamente e de forma independente do cadastro.</p>
        </section>
        <section><h2>6. Disponibilidade e alterações</h2>
          <p>A plataforma pode receber atualizações e sofrer interrupções técnicas. Os responsáveis podem atualizar estes termos, com novo aceite para versões relevantes. O projeto ainda depende da definição formal de responsável, e-mail de contato, política de retenção e procedimento de exclusão de contas.</p>
        </section>
        <section><h2>7. Contato</h2>
          <p>Momentum — Hackathon IFC 2026. O responsável e o e-mail de contato devem ser divulgados pela equipe antes do lançamento público definitivo.</p>
        </section>
      </article>
    </div>
  </main>
</template>

<style scoped>
.terms-page{min-height:100dvh;background:#f6f6f5;color:#171717;padding:clamp(16px,4vw,48px)}.terms-container{max-width:940px;margin:auto}.terms-back{font-size:13px;font-weight:700;text-decoration:underline}.terms-article{margin:25px 0;background:#fff;border:1px solid #e5e5e5;border-radius:20px;padding:clamp(24px,5vw,56px)}.terms-kicker{letter-spacing:1.6px;font-size:11px;color:#777;font-weight:750}.terms-article h1{font-size:clamp(28px,4vw,40px);font-weight:800;letter-spacing:-1px;margin-top:8px}.terms-date{font-size:12px;color:#777}.terms-article section{margin-top:24px;padding-top:20px;border-top:1px solid #eee}.terms-article h2{font-size:18px;font-weight:750}.terms-article p{margin-top:12px;font-size:14px;line-height:1.75;color:#414141}.terms-article a{text-decoration:underline;font-weight:700}
</style>
