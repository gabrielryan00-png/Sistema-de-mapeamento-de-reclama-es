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
    # Frases exclusivas de resposta de unidade
    r"Resposta\s+à\s+Manifesta[çc][aã]o\s+de\s+Ouvidoria",  # título do doc 2
    r"EM RESPOSTA",
    r"VIMOS RESPONDER",
    r"RESPONDEMOS",
    r"INFORMAMOS QUE",
    r"ESCLARECEMOS",
    r"RETORNO À MANIFESTAÇÃO",
    r"Agradecemos\s+por\s+entrar\s+em\s+contato",
    r"ATENCIOSAMENTE",
    r"Enfermeira[/\s]Gerente",
    r"Coordenadora\s+da\s+Unidade",
    r"OFÍCIO",
    r"COMUNICAMOS",
]

SINAIS_OUVIDORIA = [
    # Estrutura exclusiva do documento da Controladoria
    r"CONTROLADORIA\s+GERAL\s+DO\s+MUNIC",
    r"E\s*M\s*E\s*N\s*T\s*A\s+D\s*A\s+D\s*E\s*M\s*A\s*N\s*D\s*A",  # "E M E N T A D A D E M A N D A"
    r"E\s*N\s*C\s*A\s*M\s*I\s*N\s*H\s*A\s*M\s*E\s*N\s*T\s*O",      # "E N C A M I N H A M E N T O"
    r"Lei\s+13\.460",
    r"MANIFESTAÇÃO DE USUÁRIO",
    r"P\.O\.\s+\d{3,6}",
    r"RECOMENDAMOS",
    r"PROTOCOLO",
    r"RECLAMAÇÃO",
    r"DENÚNCIA",
    r"SOLICITA",
]

# Pesos/boosts aplicados pelo classificador
CLASSIFIER_WEIGHTS = {
    "inicio_boost": 3,   # bônus se o início do documento tem sinais de resposta
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
