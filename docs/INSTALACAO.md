# Instalação

## Pré-requisitos

| Componente | Versão | Link |
|------------|--------|------|
| Python | 3.9+ | [python.org](https://python.org) |
| Tesseract OCR | 5.x | Ver abaixo |
| Poppler | qualquer | Ver abaixo |
| Git | qualquer | [git-scm.com](https://git-scm.com) |

---

## Linux (Ubuntu / Debian)

```bash
# 1. Dependências do sistema
sudo apt update
sudo apt install -y python3 python3-venv python3-pip \
    tesseract-ocr tesseract-ocr-por \
    poppler-utils \
    git

# 2. Clonar o repositório
git clone https://github.com/gabrielryan00-png/Sistema-de-mapeamento-de-reclama-es.git
cd Sistema-de-mapeamento-de-reclama-es

# 3. Criar ambiente virtual e instalar dependências
make install
# equivalente a:
# python3 -m venv venv && venv/bin/pip install -r requirements.txt

# 4. Configurar credenciais
cp config.json.example config.json
nano config.json   # preencha email e senha_app

# 5. Iniciar
python3 ouvidoriabot.py
# ou
make run
```

### Atalho no menu de aplicativos (opcional)
```bash
make desktop-install
# Remove com: make uninstall-desktop
```

---

## macOS

```bash
# 1. Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Dependências
brew install python tesseract tesseract-lang poppler git

# 3. Clonar e instalar
git clone https://github.com/gabrielryan00-png/Sistema-de-mapeamento-de-reclama-es.git
cd Sistema-de-mapeamento-de-reclama-es
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Configurar
cp config.json.example config.json
open config.json   # edite com seu editor

# 5. Iniciar
python ouvidoriabot.py
```

---

## Windows

### 1. Python
Baixe em [python.org/downloads](https://python.org/downloads).  
Durante a instalação marque **"Add Python to PATH"**.

### 2. Tesseract OCR
1. Baixe o instalador em [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
2. Durante a instalação, selecione o pacote de idioma **Português**
3. Anote o caminho de instalação (ex: `C:\Program Files\Tesseract-OCR\tesseract.exe`)
4. Coloque esse caminho no campo `tesseract_path` do `config.json`

### 3. Poppler
1. Baixe em [oschwartz10612/poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases)
2. Extraia para `C:\poppler`
3. Adicione `C:\poppler\Library\bin` ao PATH do Windows:
   - Painel de Controle → Sistema → Variáveis de ambiente → PATH → Editar → Novo

### 4. Instalação automática
```powershell
# Abra o PowerShell como usuário (não precisa de admin)
cd C:\caminho\para\Sistema-de-mapeamento-de-reclama-es
powershell -ExecutionPolicy Bypass -File .\install_windows.ps1
```

Isso cria o venv, instala dependências e cria atalho no Menu Iniciar.

### 5. Instalação manual (alternativa)
```cmd
cd C:\caminho\para\Sistema-de-mapeamento-de-reclama-es
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy config.json.example config.json
```

### 6. Iniciar no Windows
```cmd
venv\Scripts\python ouvidoriabot.py
```
Ou use o atalho "Ouvidoria Ecosystem" no Menu Iniciar.

---

## Verificar instalação

Após instalar, verifique se o Tesseract está funcionando:

```bash
tesseract --version
# Deve mostrar: tesseract 5.x.x
```

Verifique o Poppler:
```bash
pdfinfo --version
# Deve mostrar: pdfinfo version X.X
```

Teste Python:
```bash
python -c "import pytesseract, pdfplumber, openpyxl, flask; print('OK')"
```

---

## Configuração inicial do banco de e-mails

Após instalar, configure os e-mails das unidades de saúde:

1. Abra `banco.py`
2. Preencha os e-mails institucionais de cada USF na função `inserir_unidades()`
3. Execute uma vez para criar o banco:

```bash
python banco.py
# ✅ Banco criado e unidades inseridas.
```

---

## Atualizar o sistema

```bash
git pull origin main
pip install -r requirements.txt   # atualiza dependências se necessário
```

---

## Desinstalar atalho (Linux)

```bash
make uninstall-desktop
# ou
./uninstall_desktop.sh
```
