import sqlite3

DB = "ouvidorias.db"

# ==============================
# CONEXÃO
# ==============================
def conectar():
    return sqlite3.connect(DB)

# ==============================
# CRIAR TABELA
# ==============================
def criar_tabela():
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS unidades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE,
        email TEXT
    )
    """)

    conn.commit()
    conn.close()

# ==============================
# INSERIR DADOS — configure os e-mails institucionais das unidades
# ==============================
def inserir_unidades():
    # Substitua os valores abaixo pelos e-mails reais das unidades
    dados = {
        "USF Dr. Eduardo Nakamura":                    "",
        "USF Jardim Europa":                           "",
        "USF Onesia Benedita Miguel":                  "",
        "USF Marcelino Maria Rodrigues":               "",
        "USF Manuel Evangelista de Oliveira":          "",
        "USF Recanto São José":                        "",
        "USF Vereador Gregório Bonifácio da Silva":    "",
        "USF Jardim do Lago":                          "",
        "USF Antonio Marques de Carvalho":             "",
        "USF Maria Jose Lima Souza":                   "",
        "USF Jardim Revista":                          "",
        "USF Vereador Marsal Lopes Rosa":              "",
    }

    conn = conectar()
    cursor = conn.cursor()

    for nome, email in dados.items():
        cursor.execute(
            "INSERT OR IGNORE INTO unidades (nome, email) VALUES (?, ?)",
            (nome, email)
        )

    conn.commit()
    conn.close()

# ==============================
# BUSCAR EMAIL
# ==============================
def buscar_email_unidade(nome):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute("SELECT email FROM unidades WHERE nome = ?", (nome,))
    result = cursor.fetchone()

    conn.close()

    return result[0] if result else None

# ==============================
# EXECUTAR UMA VEZ (SETUP)
# ==============================
if __name__ == "__main__":
    criar_tabela()
    inserir_unidades()
    print("✅ Banco criado e unidades inseridas.")
