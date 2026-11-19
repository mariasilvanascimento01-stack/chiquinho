# Conectar ao Supabase

O projeto já está configurado com a URL pública do Supabase em `supabase-config.js`.

## 1. Aplicar o banco

1. Abra o Supabase Dashboard.
2. Entre em **SQL Editor**.
3. Abra o arquivo `supabase/migrations/20261119000000_create_chiquinho_store.sql`.
4. Cole o conteúdo no editor e execute **Run**.

A migração cria os produtos, cupons, clientes, pedidos, itens e uma função segura para finalizar pedidos. A chave configurada é pública e pode ser usada pelo navegador. Não adicione `service_role`, senhas ou tokens secretos ao projeto.

## 2. Validar

Depois da migração, abra esta URL no navegador substituindo os valores da configuração:

```text
https://kfdopzktconxshhjtlct.supabase.co/rest/v1/products?select=id&limit=1
```

O endereço deve responder com uma lista JSON contendo produtos.

## 3. Segurança

Os produtos e cupons têm leitura pública. O checkout usa uma função RPC no servidor do Supabase, que recalcula preços e descontos com base no banco.
