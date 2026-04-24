# =============================================================================
# CONSTANTES E FUNÇÕES COMPARTILHADAS
# =============================================================================
import unicodedata

# Catálogo centralizado de USFs
CATALOGO_USF = [
    {"nome": "USF Vereador Marsal Lopes Rosa",
     "aliases": ["vereador marsal lopes rosa","marsal lopes rosa","marsal rosa","vila amorim","usf vila amorim","ubs vila amorim"]},
    {"nome": "USF Dr. Eduardo Nakamura",
     "aliases": ["eduardo nakamura","dr eduardo nakamura","doutor eduardo nakamura","nakamura","dr nakamura","jardim nakamura"]},
    {"nome": "USF Jardim Europa",
     "aliases": ["jardim europa","jd europa","usf europa","ubs europa"]},
    {"nome": "USF Jardim do Lago",
     "aliases": ["jardim do lago","jd do lago","jardim lago","usf lago","ubs lago"]},
    {"nome": "USF Manuel Evangelista de Oliveira",
     "aliases": ["manuel evangelista de oliveira","manuel evangelista","manoel evangelista",
                 "jardim sao jose","jardim são jose","jardim são josé","jardim s jose","jd sao jose"]},
    {"nome": "USF Onesia Benedita Miguel",
     "aliases": ["onesia benedita miguel","onesia benedita","onesia miguel","onesi benedita miguel",
                 "jardim suzanopolis","jardim suzanópolis","suzanopolis","suzanópolis","suzano polis","jd suzanopolis"]},
    {"nome": "USF Maria Jose Lima Souza",
     "aliases": ["maria jose lima souza","maria jose lima","maria jose souza","jardim ikeda","ikeda"]},
    {"nome": "USF Antonio Marques de Carvalho",
     "aliases": ["antonio marques de carvalho","antonio marques","antônio marques","jardim maite","maite"]},
    {"nome": "USF Marcelino Maria Rodrigues",
     "aliases": ["marcelino maria rodrigues","marcelino maria","marcelino rodrigues","jardim brasil","jd brasil"]},
    {"nome": "USF Vereador Gregório Bonifácio da Silva",
     "aliases": ["vereador gregorio bonifacio da silva","gregorio bonifacio da silva",
                 "gregorio bonifacio","gregório bonifácio","vereador gregório","vila fatima","vila fátima"]},
    {"nome": "USF Recanto São José",
     "aliases": ["recanto sao jose","recanto são jose","recanto são josé","recanto s jose",
                 "usf recanto","ubs recanto","recanto"]},
    {"nome": "USF Jardim Revista",
     "aliases": ["jardim revista","jd revista","usf revista","ubs revista"]},
]

# Colunas do Excel de Ouvidorias
COLUNAS_OUV = ["Protocolo","Unidade","Data Recebimento","Prazo Resposta",
               "Assunto","Status","Data Respondida","Arquivo","Arquivo Resposta","Observações","Data Última Cobrança"]

# Regras e pesos para classificação de documentos (RESPOSTA vs OUVIDORIA)
# Podem ser ajustadas sem editar os detectores.
SINAIS_RESPOSTA = [
    r"EM RESPOSTA",
    r"VIMOS RESPONDER",
    r"RESPONDEMOS",
    r"INFORMAMOS QUE",
    r"ESCLARECEMOS",
    r"RETORNO À MANIFESTAÇÃO",
    r"RETORNO A",
    r"RESPOSTA",
    r"ATENCIOSAMENTE",
    r"ASSINADO",
    r"OFÍCIO",
    r"OFICIO",
    r"DESPACHO",
    r"COMUNICAMOS",
    r"REF\.|REF:\s*RESPOSTA",
]

SINAIS_OUVIDORIA = [
    r"OUVIDORIA",
    r"MANIFESTAÇÃO",
    r"DEMANDA",
    r"ENCAMINHAMENTO",
    r"CONTROLADORIA",
    r"FALTA",
    r"DEMORA",
    r"P\.O\.",
    r"PROTOCOLO",
    r"RECLAMAÇÃO",
    r"DENÚNCIA",
    r"SOLICITA",
    r"REQUERIMENTO",
]

# Pesos/boosts aplicados pelo classificador
CLASSIFIER_WEIGHTS = {
    "inicio_boost": 2,   # bônus se o início do documento tem sinais de resposta
    "resposta_weight": 1,
    "ouvidoria_weight": 1,
}


def normalizar(txt: str) -> str:
    """Normaliza texto removendo acentos e convertendo para minúsculas."""
    if not txt:
        return ""
    txt = txt.lower().strip()
    txt = unicodedata.normalize("NFD", txt)
    txt = "".join(c for c in txt if unicodedata.category(c) != "Mn")
    return txt


def identificar_unidade(nome_extraido: str):
    """Identifica unidade USF pelo nome extraído (com fuzzy matching)."""
    nome_norm = normalizar(nome_extraido)
    for item in CATALOGO_USF:
        if normalizar(item["nome"]) in nome_norm:
            return item["nome"]
        for alias in item["aliases"]:
            if normalizar(alias) in nome_norm:
                return item["nome"]
    return None
