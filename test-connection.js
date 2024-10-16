
const { Client } = require('pg')

const client = new Client({
  user: 'Florin',
  host: 'localhost',
  database: 'recipe_app',
  password: 'Delaunulaopt123.',
  port: 5432,
})

client.connect()
  .then(() => console.log('Connected successfully'))
  .catch(e => console.error('Connection error', e))
  .finally(() => client.end())