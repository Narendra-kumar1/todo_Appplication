const express = require('express')
const app = express()
const {format} = require('date-fns')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
let db = null

const {isValid} = require('date-fns')
const priorityList = ['HIGH', 'MEDIUM', 'LOW']
const statusList = ['TO DO', 'IN PROGRESS', 'DONE']
const categoryList = ['WORK', 'LEARNING', 'HOME']
const filepath = path.join(__dirname, 'todoApplication.db')
app.use(express.json())
const validTest = obj => {
  const {status, priority, category, todo, dueDate} = obj
  if (status !== undefined) {
    if (!statusList.includes(status)) {
      return 'Todo Status'
    }
  }
  if (priority !== undefined) {
    if (!priorityList.includes(priority)) {
      return 'Todo Priority'
    }
  }
  if (category !== undefined) {
    if (!categoryList.includes(category)) {
      return 'Todo Category'
    }
  }
  if (dueDate !== undefined) {
    if (!isValid(new Date(dueDate))) {
      return 'Due Date'
    }
  }
}
const update = obj => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  }
}
app.get('/todos/', async (request, response) => {
  const {
    status = '',
    priority = '',
    search_q = '',
    category = '',
  } = request.query

  let check = validTest(request.query)
  if (check !== undefined) {
    response.status(400)
    response.send(`Invalid ${check}`)
  }
  let query = ''
  if (status !== '' && priority !== '') {
    query = `select * from todo where status like "%${status}%" and priority like "${priority}"`
  } else if (category !== '' && priority !== '') {
    query = `select * from todo where category="${category}" and priority="${priority}"`
  } else if (category !== '' && status !== '') {
    query = `select * from todo where category="${category}" and status ="${status}"`
  } else if (status !== '') {
    query = `select * from todo where status="${status}"`
  } else if (priority !== '') {
    query = `select * from todo where priority="${priority}"`
  } else if (category !== '') {
    query = `select * from todo where category="${category}"`
  } else if (search_q !== '') {
    query = `select * from todo where todo like "%${search_q}%"`
  }
  let queryRes = await db.all(query)
  let res = queryRes.map(obj => update(obj))
  response.send(res)
})

app.get('/todo/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const query = `select * from todo where id=${todoId}`

  const queryres = await db.get(query)

  response.send(update(queryres))
})
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  let obj = {dueDate: date}
  let check = validTest(obj)
  if (check !== undefined) {
    response.status(400)
    response.send(`Invalid ${check}`)
    return
  }
  const date1 = format(new Date(date), 'yyyy-MM-dd')

  const query = `select * from todo where due_date="${date1}"`
  const queryres = await db.all(query)
  let res = queryres.map(obj => update(obj))
  response.send(res)
})

app.post('/todos/', async (request, response) => {
  const details = request.body
  let check = validTest(details)
  if (check !== undefined) {
    response.status(400)
    response.send(`Invalid ${check}`)
  }
  const {id, category, status, todo, priority, dueDate} = details
  const query = `insert into todo values (${id},"${todo}","${priority}","${status}","${category}","${dueDate}")`
  await db.run(query)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const details = request.body
  const {
    status = '',
    priority = '',
    todo = '',
    category = '',
    dueDate = '',
  } = details
  let check = validTest(details)
  if (check !== undefined) {
    response.status(400)
    response.send(`Invalid ${check}`)
  }
  let query = '',
    str = ''
  if (status !== '') {
    query = `update todo set status="${status}"`
    str = 'Status Updated'
  } else if (priority !== '') {
    query = `update todo set priority="${priority}"`
    str = 'Priority Updated'
  } else if (todo !== '') {
    query = `update todo set todo="${todo}"`
    str = 'Todo Updated'
  } else if (category !== '') {
    query = `update todo set category="${category}"`
    str = 'Category Updated'
  } else if (dueDate !== '') {
    query = `update todo set due_date="${dueDate}"`
    str = 'Due Date Updated'
  }

  await db.run(query)
  response.send(str)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `delete from todo where id=${todoId}`
  await db.run(query)
  response.send('Todo Deleted')
})

const InitializeDbandServer = async () => {
  try {
    db = await open({
      filename: filepath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server started')
    })
  } catch (e) {
    console.log(`error message is ${e}`)
    process.exit(1)
  }
}

InitializeDbandServer()

module.exports = app
