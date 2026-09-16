/**
 * Portal do Cliente - Integração com API de Registro Completo
 * 
 * Este arquivo estende portal.js com suporte para:
 * - Carregamento de dados completos via /api/clientes/:clienteId/registro
 * - Renderização de serviços com fotos e observações
 * - Gerenciamento de próximos cuidados
 * - Upload de imagens
 */

(() => {
const API_BASE_URL = window.PortalConfig?.apiBaseUrl || "http://localhost:3001/api";

// ========== Funções de Formatação ==========

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatCurrency(value) {
  if (!value) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function truncate(text, length = 100) {
  if (!text) return "—";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

// ========== Utilitários de API ==========

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem("portalToken");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("portalToken");
    localStorage.removeItem("portalCliente");
    window.location.href = "../../registro.html";
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erro ao comunicar com servidor");
  }

  return response.json();
}

// ========== Carregamento de Registro Completo ==========

async function loadRegistroCompleto(clienteId) {
  try {
    const data = await fetchAPI(`/clientes/${clienteId}/registro`);
    return data;
  } catch (error) {
    console.error("Erro ao carregar registro:", error);
    throw error;
  }
}

// ========== Renderização de Serviços ==========

function renderServicoCard(servico) {
  const statusClass = {
    concluido: "portal-status-concluido",
    andamento: "portal-status-andamento",
    agendado: "portal-status-andamento",
  }[servico.status] || "portal-status-andamento";

  const statusLabel = {
    concluido: "Concluído",
    andamento: "Em andamento",
    agendado: "Agendado",
  }[servico.status] || servico.status;

  let fotosHTML = "";
  if (servico.fotos && servico.fotos.length > 0) {
    fotosHTML = `
      <div class="portal-servico-fotos">
        ${servico.fotos
          .slice(0, 2)
          .map(
            (foto) => `
          <img src="${new URL(foto.url, API_BASE_URL.replace(/\/api$/, "/")).toString()}" alt="${escapeHtml(foto.tipo)}" class="portal-servico-foto" />
        `
          )
          .join("")}
        ${servico.fotos.length > 2 ? `<span class="portal-fotos-mais">+${servico.fotos.length - 2}</span>` : ""}
      </div>
    `;
  }

  let observacoesHTML = "";
  if (servico.observacoes && servico.observacoes.length > 0) {
    observacoesHTML = `
      <div class="portal-servico-observacoes">
        <h4>Observações</h4>
        ${servico.observacoes
          .slice(0, 2)
          .map(
            (obs) => `
          <div class="portal-observacao">
            <strong>${escapeHtml(obs.titulo || "Sem título")}</strong>
            <p>${escapeHtml(truncate(obs.descricao, 80))}</p>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  return `
    <article class="portal-servico-card">
      <div class="portal-servico-header">
        <div>
          <h3>${escapeHtml(servico.tipo)}</h3>
          <span class="portal-status ${statusClass}">${statusLabel}</span>
        </div>
        <time>${formatDate(servico.dataServico)}</time>
      </div>
      <p>${escapeHtml(truncate(servico.descricao, 120))}</p>
      ${fotosHTML}
      ${observacoesHTML}
      ${servico.responsavel ? `<small>Responsável: ${escapeHtml(servico.responsavel)}</small>` : ""}
      ${servico.valor ? `<small class="portal-servico-valor">${formatCurrency(servico.valor)}</small>` : ""}
    </article>
  `;
}

// ========== Renderização de Próximos Cuidados ==========

function renderProximoCuidadoCard(cuidado) {
  const statusClass = {
    pendente: "portal-status-andamento",
    concluido: "portal-status-concluido",
    cancelado: "portal-status-cancelado",
  }[cuidado.status] || "portal-status-andamento";

  const statusLabel = {
    pendente: "Pendente",
    concluido: "Concluído",
    cancelado: "Cancelado",
  }[cuidado.status] || cuidado.status;

  return `
    <article class="portal-cuidado-card">
      <div class="portal-cuidado-header">
        <h3>${escapeHtml(cuidado.titulo)}</h3>
        <span class="portal-status ${statusClass}">${statusLabel}</span>
      </div>
      <p>${escapeHtml(cuidado.descricao || "Sem descrição")}</p>
      ${cuidado.dataPrevista ? `<time>Previsto para: ${formatDate(cuidado.dataPrevista)}</time>` : ""}
    </article>
  `;
}

// ========== Upload de Fotos ==========

async function uploadFoto(servicoId, file, tipo, descricao = "") {
  const formData = new FormData();
  formData.append("foto", file);
  formData.append("tipo", tipo);
  if (descricao) formData.append("descricao", descricao);

  const token = localStorage.getItem("portalToken");

  const response = await fetch(`${API_BASE_URL}/fotos/servicos/${servicoId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erro ao fazer upload da foto");
  }

  return response.json();
}

// ========== População de Páginas ==========

async function populateDashboardWithRegistro(clienteId) {
  try {
    const registro = await loadRegistroCompleto(clienteId);

    // Elementos comuns
    const greetingEl = document.getElementById("portalGreeting");
    if (greetingEl) {
      const primeiroNome = registro.cliente.nome.split(" ")[0];
      greetingEl.textContent = primeiroNome;
    }

    const userNameEl = document.getElementById("portalUserName");
    if (userNameEl) userNameEl.textContent = registro.cliente.nome || "—";

    // Estatísticas
    const cardVisitas = document.getElementById("portalCardVisitas");
    if (cardVisitas) {
      cardVisitas.textContent = registro.estatisticas.totalServicos || "0";
    }

    const cardInicio = document.getElementById("portalCardInicio");
    if (cardInicio) {
      cardInicio.textContent = formatDate(registro.jardins?.[0]?.dataInicio);
    }

    const cardUltimaManutencao = document.getElementById("portalCardUltimaManutencao");
    if (cardUltimaManutencao) {
      cardUltimaManutencao.textContent = formatDate(registro.estatisticas.ultimaVisita);
    }

    const cardProximaVisita = document.getElementById("portalCardProximaVisita");
    if (cardProximaVisita) {
      // Sem serviço futuro agendado, usa o próximo cuidado pendente com data >= hoje
      // (a lista já vem ordenada por dataPrevista ASC no registro).
      const hoje = new Date().toLocaleDateString("en-CA");
      const proximoCuidado = (registro.proximosCuidados || []).find(
        (c) => c.status === "pendente" && c.dataPrevista && String(c.dataPrevista).slice(0, 10) >= hoje
      );
      cardProximaVisita.textContent = formatDate(
        registro.estatisticas.proximaManutencao || proximoCuidado?.dataPrevista
      );
    }

    // Dados pessoais
    const dadoNome = document.getElementById("portalDadoNome");
    if (dadoNome) dadoNome.textContent = registro.cliente.nome || "—";

    const dadoCpf = document.getElementById("portalDadoCpf");
    if (dadoCpf) dadoCpf.textContent = registro.cliente.cpf || "—";

    const dadoTelefone = document.getElementById("portalDadoTelefone");
    if (dadoTelefone) dadoTelefone.textContent = registro.cliente.telefone || "—";

    const dadoEmail = document.getElementById("portalDadoEmail");
    if (dadoEmail) dadoEmail.textContent = registro.cliente.email || "—";

    const dadoEndereco = document.getElementById("portalDadoEndereco");
    if (dadoEndereco) dadoEndereco.textContent = registro.cliente.endereco || "—";

    // Histórico de serviços
    const historicoBody = document.getElementById("portalHistoricoRecenteBody");
    if (historicoBody && registro.servicos) {
      historicoBody.innerHTML = registro.servicos.length
        ? registro.servicos.slice(0, 5).map((servico) => `
          <tr>
            <td>${formatDate(servico.dataServico)}</td>
            <td>${escapeHtml(servico.tipo)}</td>
            <td>${escapeHtml(servico.descricao || "—")}</td>
            <td>${escapeHtml(servico.responsavel || "—")}</td>
            <td>${servico.valor ? formatCurrency(servico.valor) : "—"}</td>
          </tr>`).join("")
        : `<tr><td colspan="5">Seu cadastro está ativo. Você ainda não possui serviços registrados.</td></tr>`;
    }

    // Próximos cuidados
    const cuidadosContainer = document.getElementById("portalProximosCuidadosContainer");
    if (cuidadosContainer && registro.proximosCuidados) {
      if (registro.proximosCuidados.length === 0) {
        cuidadosContainer.innerHTML = '<p class="portal-empty">Nenhum cuidado programado.</p>';
      } else {
        cuidadosContainer.innerHTML = registro.proximosCuidados
          .map((c) => renderProximoCuidadoCard(c))
          .join("");
      }
    }

    // Remover skeletons
    document.querySelectorAll(".portal-skeleton-target").forEach((el) => {
      el.classList.remove("portal-skeleton");
    });

    return registro;
  } catch (error) {
    console.error("Erro ao popular dashboard:", error);
    showToast(error.message || "Erro ao carregar dados", "error");
    throw error;
  }
}

// ========== Exportar para uso global ==========

window.RegistroAPI = {
  loadRegistroCompleto,
  populateDashboardWithRegistro,
  uploadFoto,
  fetchAPI,
  formatDate,
  formatCurrency,
  renderServicoCard,
  renderProximoCuidadoCard,
};

if (document.body.dataset.portalPage === "dashboard") {
  try {
    const token = localStorage.getItem("portalToken");
    // getAuthClienteId (portal.js) usa o "sub" do JWT; portalCliente.id é só fallback.
    const clienteId = token ? getAuthClienteId(token) : null;
    if (clienteId) {
      populateDashboardWithRegistro(clienteId).catch(() => {
        showToast("Não foi possível carregar seus dados. Tente novamente.", "error");
      });
    }
  } catch (error) {
    showToast("Não foi possível carregar seus dados. Tente novamente.", "error");
  }
}
})();
