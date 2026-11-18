# Banco de dados local

`database.sql` define o esquema SQLite e cadastra os seis produtos e os cupons iniciais. Para criar ou reinicializar um banco local com a ferramenta `sqlite3`, execute:

```powershell
sqlite3 chiquinho.sqlite ".read database.sql"
```

O arquivo `chiquinho.sqlite` é local e ignorado pelo Git; mantenha o esquema e os dados iniciais em `database.sql`.

O site atual é estático e ainda não acessa este banco. Um backend/API precisa validar preços e cupons e gravar pedidos antes que a confirmação do site represente uma compra real. O perfil demonstrativo não contém senha; não armazene senhas em texto puro nem dados de pagamento neste banco.
