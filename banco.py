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
# INSERIR DADOS (SEUS 12 EMAILS)
# ==============================
def inserir_unidades():
    dados = {
        "USF Dr. Eduardo Nakamura": "usfjardimnakamura@ints.org.br",
        "USF Jardim Europa": "usfjardimeuropa@ints.org.br",
        "USF Onesia Benedita Miguel": "usfjardimsuzanopolis@ints.org",
        "USF Marcelino Maria Rodrigues": "usfjardimbrasil@ints.org.br",
        "USF Manuel Evangelista de Oliveira": "usfjardimsaojose@ints.org.br",
        "USF Recanto São José": "usfrecantosaojose@ints.org.br",
        "USF Vereador Gregório Bonifácio da Silva": "usfvilafatima@ints.org.br",
        "USF Jardim do Lago": "usfjardimdolago@ints.org.br",
        "USF Antonio Marques de Carvalho": "usfjardimmaite@ints.org.br",
        "USF Maria Jose Lima Souza": "usfjardimikeda@ints.org.br",
        "USF Jardim Revista": "usfjardimrevista@ints.org.br",
        "USF Vereador Marsal Lopes Rosa": "usfvilaamorim@ints.org.br",
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
