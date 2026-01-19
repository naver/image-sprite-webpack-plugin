import React from 'react';
import css from '../css/Hello.css';
import List from './List.jsx';

function Hello() {
  return (
    <div>
      <h1 className={css.logo}>Todo App</h1>
      <List />
    </div>
  );
}

export default Hello;
