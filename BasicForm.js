import React from 'react';
import {
    Row,
    Col,
    Tooltip
} from 'antd';
import PropTypes from 'prop-types';
import BasicFormItem from './BasicFormItem';
import './basic-form.scss';
import createBasicForm from './createBasicForm';

export const formLayoutTypeList = ['horizontal', 'vertical', 'inline'];
export const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 14 }
}

/**
 * Basic Form
 * @param {object} props
 * @param {string} props.labelAlign left / right
 * @returns
 */
export default class BasicForm extends React.Component {
    constructor(props, context) {
        super(props, context);

        // 记录 form 值
        this.formValues = {};
    }

    /**
     * Form field value change event
     * @param {string} name
     * @param {any} value
     */
    handleValueChange = (name, value) => {
        this.formValues[name] = value;
        const nextValues = { ...this.formValues };

        if (this.props.onValueChange && typeof this.props.onValueChange === 'function') {
            this.props.onValueChange.call(this, name, value, nextValues);
        }

        if (this.props.onChange && typeof this.props.onChange === 'function') {
            this.props.onChange.call(this, name, value, nextValues);
        }
    }

    /**
     * Get name values
     * @param {string[]} nameList
     * @returns {{ [name: string]: any }}
     */
    getFormValues = (nameList) => {
        if (!nameList) {
            return Object.assign({}, this.formValues);
        }

        if (!Array.isArray(nameList)) return this.formValues[nameList];

        const nameValues = {};

        for (const name of nameList) {
            nameValues[name] = this.formValues[name];
        }

        return nameValues;
    }

    render() {
        const { formData = [], layout, labelCol, wrapperCol, labelAlign } = this.props;

        const formLayout = formLayoutTypeList.includes(layout) || formLayoutTypeList[0];
        const labelLayout = labelCol || formItemLayout.labelCol;
        const wrapperLayout = wrapperCol || formItemLayout.wrapperCol;

        const grid = 'grid' in this.props ? this.props.grid : {};

        const size = 'size' in this.props ? this.props.size : void 0;

        const itemChildren = formData.map(item => {
            if (!('size' in item) && size) item.size = size;
            if (!('labelCol' in item)) item.labelCol = labelLayout;
            if (!('wrapperCol' in item)) item.wrapperCol = wrapperLayout;
            if (!('labelAlign' in item)) item.labelAlign = labelAlign;

            return (
                <Col key={item.name}>
                    <BasicFormItem {...item} onChange={this.handleValueChange} />
                </Col>
            );
        });

        const itemChildrenWrapper = (
            <Row gutter={grid.gutter}>
                {itemChildren}
            </Row>
        );

        const children = this.props.children;

        return (
            <form className="basic-form">
                {this.props.childrenAlign === 'after' ? (
                    <React.Fragment>
                        {itemChildrenWrapper}
                        {children}
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        {children}
                        {itemChildrenWrapper}
                    </React.Fragment>
                )}
            </form>
        );
    }
}

BasicForm.contextTypes = {
    symbol: PropTypes.symbol
};
