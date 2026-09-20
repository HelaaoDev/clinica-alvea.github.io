/**
 * Clínica Alvea - Mapeadores snake_case (banco) <-> camelCase (aplicação)
 *
 * O Postgres/Supabase usa convenção snake_case para colunas; o resto do
 * backend e todo o frontend já usam camelCase (herdado da época dos
 * arquivos JSON). Estas funções isolam essa conversão em um único lugar.
 */

function mapUsuario(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    senhaHash: linha.senha_hash,
    cpf: linha.cpf,
    role: linha.role,
    telefone: linha.telefone,
    endereco: linha.endereco,
    dataNascimento: linha.data_nascimento,
    genero: linha.genero,
    fotoUrl: linha.foto_url,
    criadoEm: linha.criado_em,
  };
}

function mapProfissional(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    nome: linha.nome,
    especialidade: linha.especialidade,
    horariosDisponiveis: linha.horarios_disponiveis || [],
  };
}

function mapFamiliar(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    pacienteId: linha.paciente_id,
    nome: linha.nome,
    parentesco: linha.parentesco,
    dataNascimento: linha.data_nascimento,
    cpf: linha.cpf,
    criadoEm: linha.criado_em,
  };
}

function mapAgendamento(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    pacienteId: linha.paciente_id,
    profissionalId: linha.profissional_id,
    profissionalNome: linha.profissional_nome,
    especialidade: linha.especialidade,
    dataHora: linha.data_hora,
    status: linha.status,
    paraFamiliarId: linha.familiar_id,
    paraNome: linha.para_nome,
    criadoEm: linha.criado_em,
  };
}

function mapExame(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    agendamentoId: linha.agendamento_id,
    pacienteId: linha.paciente_id,
    tipoExame: linha.tipo_exame,
    dataRealizacao: linha.data_realizacao,
    status: linha.status,
    resultado:
      linha.status === "concluido"
        ? { laudoTexto: linha.laudo_texto, arquivoUrl: linha.arquivo_url }
        : null,
  };
}

function mapNotificacao(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    canal: linha.canal,
    destinatario: linha.destinatario,
    pacienteId: linha.paciente_id,
    agendamentoId: linha.agendamento_id,
    tipo: linha.tipo,
    simulado: linha.simulado,
    enviado: linha.enviado,
    erro: linha.erro,
    criadoEm: linha.criado_em,
  };
}

function mapContatoCorporativo(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    nomeEmpresa: linha.nome_empresa,
    cnpj: linha.cnpj,
    responsavel: linha.responsavel,
    email: linha.email,
    telefone: linha.telefone,
    numeroColaboradores: linha.numero_colaboradores,
    mensagem: linha.mensagem,
    status: linha.status,
    criadoEm: linha.criado_em,
  };
}

module.exports = {
  mapUsuario,
  mapProfissional,
  mapFamiliar,
  mapAgendamento,
  mapExame,
  mapNotificacao,
  mapContatoCorporativo,
};
