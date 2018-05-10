import React from 'react';
import css from '../css/List.css';

class List extends React.Component {
    render() {
        return (
            <ul className={css.items}>
                <li>
                    <h2>
                        <span className={css.itemPicture}></span>
                        <span>Pictures to take</span>
                    </h2>
                    <ul className={css.todos}>
                        <li>
                            <span className={css.checkOk}></span>
                            <span>My Cats</span>
                        </li>
                        <li>
                            <span className={css.check}></span>
                            <span>Their Dogs</span>
                        </li>
                        <li>
                            <span className={css.star}></span>
                            <span>And Svgs</span>
                        </li>
                    </ul>
                </li>
                <li>
                    <h2>
                        <span className={css.itemArticle}></span>
                        <span>Articles to read</span>
                    </h2>
                    <ul className={css.todos}>
                        <li>
                            <span className={css.check}></span>
                            <span>Demian (Hermann Hesse)</span>
                        </li>
                        <li>
                            <span className={css.checkOk}></span>
                            <span>Martian Time-Slip (Philip K. Dick)</span>
                        </li>
                    </ul>
                </li>
            </ul>
        );
    }
}

export default List;
