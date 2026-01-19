import React from 'react';
import css from '../css/List.css';

function List() {
  return (
    <div>
      <ul className="items">
        <li>
          <h2>
            <span className={css.itemPicture}></span>
            <span>Pictures</span>
          </h2>
        </li>
        <li>
          <h2>
            <span className={css.itemArticle}></span>
            <span>Articles</span>
          </h2>
        </li>
      </ul>
      <ul className="todos">
        <li>
          <span className={css.checkOk}></span>
          <span>Task 1 - Completed</span>
        </li>
        <li>
          <span className={css.check}></span>
          <span>Task 2 - Pending</span>
        </li>
      </ul>
    </div>
  );
}

export default List;
