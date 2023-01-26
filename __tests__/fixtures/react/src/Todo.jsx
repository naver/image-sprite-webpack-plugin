import css from './Todo.css';

const Todo = () => {
  return (
    <div>
      <h1 className={css.logo}>Todos</h1>
      <ul className={css.items}>
        <li>
          <h2>
            <span className={css.itemPicture}></span>
            <span>Taking pictures</span>
          </h2>
          <ul className={css.todos}>
            <li>
              <span className={css.checkOk}></span>
              <span>Salems</span>
            </li>
            <li>
              <span className={css.check}></span>
              <span>Pumpkins</span>
            </li>
          </ul>
        </li>
        <li>
          <h2>
            <span className={css.itemArticle}></span>
            <span>Reading books</span>
          </h2>
          <ul className={css.todos}>
            <li>
              <span className={css.check}></span>
              <span>The Lord of the Rings (J. R. R. Tolkien)</span>
            </li>
            <li>
              <span className={css.checkOk}></span>
              <span>Martian Time-Slip (Philip K. Dick)</span>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Todo;
