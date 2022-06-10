/* src/App.js */
import React, { useEffect, useState } from "react";
import { Amplify, API, graphqlOperation } from "aws-amplify";
import { withAuthenticator, Button, Heading } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { createTodo, updateTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";

import awsExports from "./aws-exports";
Amplify.configure(awsExports);

const initialState = { name: "", description: "" };

const App = ({ signOut, user }) => {
  const [formState, setFormState] = useState(initialState);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos));
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (err) {
      console.log("error fetching todos");
    }
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return;
      const todo = { ...formState, completed: false };
      setTodos([...todos, todo]);
      setFormState(initialState);
      await API.graphql(graphqlOperation(createTodo, { input: todo }));
    } catch (err) {
      console.log("error creating todo:", err);
    }
  }

  async function toggleStatus(id) {
    try {
      const todo = todos.find(todo => todo.id === id);
      if (!todo) {
        throw new Error("Unknown todo");
      }
      
      const updateTodoInput = {
        id: todo.id,
        completed: !todo.completed
      };

      await API.graphql(graphqlOperation(updateTodo, { input: updateTodoInput }));

      const updatedTodo = { ...todo, ...updateTodoInput }
      setTodos([...todos.map(t => t.id === id ? updatedTodo : t)]);
    } catch (err) {
      console.log("error changing todo status:", err);
    }
  }

  return (
    <div style={styles.container}>
      {/* Auth */}
      <Heading level={1}>Hello {user.username}</Heading>
      <Button onClick={signOut}>Sign out</Button>
      <hr style={styles.hr} />

      {/* Create TODO */}
      <h2>Amplify Todos</h2>
      <input
        onChange={(event) => setInput("name", event.target.value)}
        style={styles.input}
        value={formState.name}
        placeholder="Name"
      />
      <input
        onChange={(event) => setInput("description", event.target.value)}
        style={styles.input}
        value={formState.description}
        placeholder="Description"
      />
      <button style={styles.button} onClick={addTodo}>
        Create Todo
      </button>
      <hr style={styles.hr} />

      {/* List Todos */}
      {todos.map((todo, index) => (
        <div
          key={todo.id ? todo.id : index}
          style={{
            ...styles.todo,
            ...(todo.completed && styles.todoCompleted),
          }}
        >
          <div style={styles.todoContent}>
            <p style={styles.todoName}>{todo.name}</p>
            <p style={styles.todoDescription}>{todo.description}</p>
          </div>
          <div style={styles.todoAction}>
            <button
              style={styles.todoActionToggle}
              title={todo.completed ? "Mark as Pending" : "Mark as Complete"}
              onClick={() => toggleStatus(todo.id)}
            >
              {todo.completed ? "❌" : "✔"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    width: 600,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 20,
  },
  todo: {
    marginBottom: 15,
    display: "flex",
  },
  todoCompleted: {
    backgroundColor: "green",
  },
  todoContent: {
    flex: "90%",
  },
  todoAction: {
    flex: "10%",
    display: "flex",
    flexDirection: "column",
    padding: 0,
    margin: 0,
  },
  todoActionToggle: {
    paddingTop: "100%",
    paddingBottom: "100%",
  },
  input: {
    border: "none",
    backgroundColor: "#ddd",
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  todoName: { fontSize: 20, fontWeight: "bold" },
  todoDescription: { marginBottom: 0 },
  button: {
    backgroundColor: "black",
    color: "white",
    outline: "none",
    fontSize: 18,
    padding: "12px 0px",
  },
  hr: {
    width: "100%",
    marginTop: "24px",
    marginBottom: "24px",
  },
};

export default withAuthenticator(App);
