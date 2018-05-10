import React from 'react';
import { More } from 'some-npm-package';
import css from '../css/Hello.css';
import List from './List.jsx';

class Hello extends React.Component {
    render() {
        return (
            <div>
                <h1 className={css.logo}>
                    Hello
                </h1>
                <List />
                <More />
            </div>
        );
    }
}

export default Hello;
