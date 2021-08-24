import React from 'react';
import {
    Input,
    Select,
    Checkbox,
    DatePicker,
    InputNumber,
    Row,
    Col,
    Tooltip,
    Icon
} from 'antd';
import moment from 'moment';
import Schema from 'async-validator';
import PropTypes from 'prop-types';
import createBasicForm from './createBasicForm';
import { formLayoutTypeList, formItemLayout } from './BasicForm';

function action(target, name, descriptor) {
    descriptor = {
        enumerable : true,
        configurable : true,
        get() {
            return this.state.value;
        },
        set(value) {
            this.setState({ [name]: value });
        }
    };
    Object.defineProperty(target, name, descriptor);
    return descriptor;
}

const { Option } = Select;
const { RangePicker } = DatePicker;
const dateFormat = 'DD/MM/YYYY';
const statusEnum = {
    VALID: 'VALID', // 检查通过
    INVALID: 'INVALID', // 检查失败
    PENDING: 'PENDING', // 检查中
    DISABLED: 'DISABLED', // 禁用
    PRISTINE: 'PRISTINE' // 原始状态，没有被修改过
};

export default class BasicFormItem extends React.Component {
    constructor (props, context) {
        super(props, context);

        this.state = {
            value: void 0,
            errors: [],
            status: statusEnum.PRISTINE
        };

        const descriptor = {};
        const rules = props.rules || [];

        if (props.required && !rules.find(item => item.required)) {
            rules.push({ required: true });
        }

        if (rules && rules.length) {
            descriptor[props.name] = rules;
            this.validator = new Schema(descriptor);
        }

        this._setState = this.setState;

        this.setState = (state, callback) => new Promise((resolve) => {
            this._setState(state, () => {
                typeof callback === 'function' && callback.call(this);
                resolve();
            });
        });

        typeof createBasicForm.saveBasicFormItem === 'function' && createBasicForm.saveBasicFormItem(this.props.name, this);
    }

    componentDidMount() {
        this.resetField();
    }

    /**
     * set value error
     * @param {*} data
     */
     setField(data) {
        const nextState = {};
        if ('value' in data) {
            nextState.value = data.value;
        }

        if ('errors' in data) {
            nextState.errors = data.errors;
        }

        if (nextState.errors && nextState.errors.length) {
            nextState.status = statusEnum.INVALID;
        } else {
            nextState.status = statusEnum.VALID;
        }

        this.setState(nextState);
    }

    resetField() {
        let value = void 0;
        let errors = [];
        let status = statusEnum.PRISTINE;

        if ('value' in this.props) {
            value = this.props.value;
        } else if ('initialValue' in this.props) {
            value = this.props.initialValue;
        }

        if ('errors' in this.props) {
            errors = this.props.errors;
        }

        if (errors && errors.length) {
            status = statusEnum.INVALID;
        }

        this.setState({ value, errors, status });
    }

    handleChange = value => {
        const { onChange, name } = this.props;

        this.setState({ value, status: statusEnum.PENDING }).then(() => {
            this.validate().catch(console.error);
        });
        typeof onChange === 'function' && onChange(name, value);
    }

    /**
     * input value change
     * @param {Event} event
     */
    handleInputChange = event => {
        this.handleChange(event.target.value);
    }

    /**
     * Select change event
     * @param {any} value
     */
    handleNumberChange = value => this.handleChange(value);

    /**
     * select value change
     * @param {string | number | boolean} value
     */
    handleSelectChange = value => this.handleChange(value);

    /**
     * CheckBox Change
     * @param {Event} event
     */
    handleCheckBoxChange = event => this.handleChange(event.target.checked);

    /**
     * DatePiker Change
     * @param {moment} date
     * @param {string} formattedValue
     */
    handleDateChange = (_, formattedValue) => {
        if (!formattedValue || (Array.isArray(formattedValue) && !formattedValue.length)) formattedValue = void 0;
        this.handleChange(formattedValue);
    }

    handleCustomizeChange = value => this.handleChange(value);

    validate = () => {
        return new Promise((resolve, reject) => {
            if (!this.validator) {
                resolve();
                return true;
            }

            this.validator.validate({ [this.props.name]: this.state.value }).then(() => {
                this.setState({ errors: null, status: statusEnum.VALID });
                resolve();
            }).catch(({ errors }) => {
                this.setState({ errors, status: statusEnum.INVALID });
                reject(errors);
            });
        });
    }

    renderError = () => {
        const { errors } = this.state;

        if (!errors || !errors.length) return null;

        const errorMessage = errors.reduce((accumulator, currentValue) => {
            return accumulator + ' ' + (currentValue.message || '');
        }, '');

        return <div className="basic-form-item-explain">{errorMessage}</div>
    }

    parseChildren = (children, key) => {
        if (!children) return children;

        if (Array.isArray(children)) {
            return children;
        }

        if (!React.isValidElement(children)) return children;

        const nextProps = { ...children.props, onChange: this.handleCustomizeChange, value: this.state.value };

        return React.cloneElement(children, nextProps);
    }

    render() {
        const props = this.props;
        const { name, label } = props;
        let options = props.options || [];
        const value = 'value' in props ? props.value : this.state.value;

        let component = null;

        const nextProps = {
            id: name,
            value,
            name,
            disabled: props.disabled,
            placeholder: props.placeholder,
            allowClear: props.allowClear !== false || false
        };

        if ('size' in this.props) nextProps.size = props.size;

        switch (props.type) {
            case 'input':
            case 'text':
                component = <Input {...nextProps} onChange={this.handleInputChange} />;
                break;

            case 'number':
                component = <InputNumber {...props} {...nextProps} onChange={this.handleNumberChange} />;
                break;

            case 'select':
            case 'list':
                component = (
                    <Select {...nextProps} onChange={this.handleSelectChange}>
                        {options.map(option => <Option value={option.value} key={option.value}>{option.label}</Option>)}
                    </Select>
                );
                break;

            case 'checkbox':
            case 'singlecheckbox':
                nextProps.checked = value;
                component = <Checkbox {...nextProps} onChange={this.handleCheckBoxChange}></Checkbox>;
                break;

            case 'date':
                nextProps.format = nextProps.format || dateFormat;
                nextProps.value = value ? moment(value, nextProps.format) : value;

                component = <DatePicker {...nextProps} onChange={this.handleDateChange} />
                break;

            case 'range':
            case 'range-data':
                nextProps.format = nextProps.format || dateFormat;

                if (Array.isArray(value) && value.length) {
                    nextProps.value = [moment(value[0], nextProps.format), moment(value[1], nextProps.format)];
                }

                if (!nextProps.placeholder) delete nextProps.placeholder;
                component = <RangePicker {...nextProps} onChange={this.handleDateChange} />
                break;

            case 'render':
            default:
                // 自定义
                if (typeof props.render === 'function') {
                    component = props.render.call(this, { ...nextProps, onChange: this.handleSelectChange });
                    break;
                }

                if (React.isValidElement(props.render)) {
                    component = React.cloneElement(props.render, { ...nextProps, onChange: this.handleSelectChange });
                    break;
                }

                if (props.children) {
                    component = this.parseChildren(props.children);
                }

                break;
        }

        const basicFormItemClassNameList = ['basic-form-item'];
        const labelColClassNameList = ['basic-form-item-label'];
        const labelClassName = props.required || (props.rules && props.rules.find(item => item.required)) ? 'basic-form-item-required' : void 0;
        const labelLayout = props.labelCol || formItemLayout.labelCol;
        const wrapperLayout = props.wrapperCol || formItemLayout.wrapperCol;

        switch (this.state.status) {
            case statusEnum.DISABLED:
                break;
            case statusEnum.INVALID:
                basicFormItemClassNameList.push('has-error');
                break;
            default:
        }

        if (props.labelAlign === 'left') labelColClassNameList.push('basic-form-item-label-left');

        return (
            <Row className={basicFormItemClassNameList.join(' ')}>
                {label ? <Col className={labelColClassNameList.join(' ')} {...labelLayout}>
                    <Tooltip title={label}>
                        <label className={labelClassName} htmlFor={name}>{label}</label>
                    </Tooltip>
                </Col> : null}
                <Col className="basic-form-item-control" {...wrapperLayout}>
                    {component}
                    <span className="basic-form-item-explain-info">
                        <Tooltip title={this.renderError()} arrowPointAtCenter>
                            <Icon type="info-circle" />
                        </Tooltip>
                    </span>
                    {this.renderError()}
                </Col>
            </Row>
        );
    }
}

BasicFormItem.contextTypes = {
    symbol: PropTypes.symbol
};
