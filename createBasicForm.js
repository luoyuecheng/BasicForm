/***********************************************************
 *
 * 装饰器 @createBasicForm.create() 可以给组件 props 上集成 basicForm
 *
 ***********************************************************/
import React from 'react';
import PropTypes from 'prop-types';

const formWrapper = () => {
    const basicFormMap = new Map();

    return {
        /**
         * create form (generator)
         */
        create() {
            return function (WrapperComponent) {
                const symbol = Symbol('basic-form');

                // create basic form item memory.
                const basicFormItemMap = new Map();
                basicFormMap.set(symbol, basicFormItemMap);

                return class extends React.Component {
                    static childContextTypes = { symbol: PropTypes.symbol };

                    getChildContext() {
                        return { symbol };
                    }

                    componentWillUnmount() {
                        basicFormItemMap.clear();
                    }

                    render() {
                        const nextProps = { ...this.props };

                        nextProps.basicForm = {
                            // 通过 name 获取表单值
                            getFieldValue(fieldName) {
                                const instance = basicFormItemMap.get(fieldName);

                                return instance ? instance.state.value : void 0;
                            },
                            // 通过 name 获取表单值，传入 name 或 name 数组，返回一组值，不传入返回全部值
                            getFieldsValue(fieldNames) {
                                if (typeof fieldNames === 'string') return this.getFieldValue(fieldNames);

                                const valueObject = {};
                                const fieldNameList = Array.isArray(fieldNames) ? fieldNames : basicFormItemMap.keys();

                                for (const fieldName of fieldNameList) valueObject[fieldName] = this.getFieldValue(fieldName);

                                return valueObject;
                            },
                            // 重置指定 name 的组件
                            resetField(fieldName) {
                                const instance = basicFormItemMap.get(fieldName);

                                if (!instance) {
                                    const error = new Error('表单中没有 "' + fieldName + '" 组件');
                                    console.warn(error);
                                    return false;
                                }

                                instance.resetField();
                                return true;
                            },
                            // 重置一组输入控件的值与状态，如不传入参数，则重置所有组件，传入一个 name 则重置一个组件
                            resetFields(fieldNames) {
                                if (typeof fieldNames === 'string') return this.resetField(fieldNames);

                                const fieldNameList = Array.isArray(fieldNames) ? fieldNames : basicFormItemMap.keys();
                                let isRight = true;

                                for (const fieldName of fieldNameList) {
                                    if (!this.resetField(fieldName)) isRight = false;
                                }

                                return isRight;
                            },

                            validateField(fieldName) {
                                return new Promise((resolve, reject) => {
                                    const instance = basicFormItemMap.get(fieldName);
                                    if (!instance) {
                                        const error = new Error('name: "' + fieldName + '" 在表单中不存在。');
                                        console.warn(error);
                                        reject([error]);
                                        return;
                                    }

                                    instance.validate().then(resolve).catch(error => reject(error));
                                });
                            },

                            validateFields(fieldNames) {
                                return new Promise(async (resolve, reject) => {
                                    const fieldNameList = Array.isArray(fieldNames) ? fieldNames : Array.from(basicFormItemMap.keys());

                                    const errorObject = {};
                                    let values = {};

                                    const fieldNameLength = fieldNameList.length;

                                    const asyncLoopFieldNameList = (index) => {
                                        if (index >= fieldNameLength) {
                                            values = this.getFieldsValue(fieldNameList);

                                            if (Object.getOwnPropertyNames(errorObject).length) {
                                                reject(errorObject, values);
                                            } else {
                                                resolve(values);
                                            }
                                            return true;
                                        }
                                        const fieldName = fieldNameList[index];

                                        this.validateField(fieldName).then(() => {
                                            asyncLoopFieldNameList(index + 1);
                                        }).catch(errors => {
                                            errorObject[fieldName] = {
                                                value: this.getFieldValue(fieldName),
                                                errors: errors
                                            };
                                            asyncLoopFieldNameList(index + 1);
                                        });
                                    }

                                    asyncLoopFieldNameList(0);
                                });
                            },

                            setFieldValue(fieldName, value) {
                                const instance = basicFormItemMap.get(fieldName);

                                if (!instance) {
                                    const error = new Error('表单中没有 "' + fieldName + '" 组件');
                                    console.warn(error);
                                    return false;
                                }

                                instance.setState({ value });
                            },

                            setFieldsValue(fieldObject) {
                                for (const fieldName in fieldObject) {
                                    this.setFieldValue(fieldName, fieldObject[fieldName]);
                                }
                            },

                            /**
                             * set field value and errors
                             * @param {string} fieldName
                             * @param {object} data { value?: any, errors?: Array<Error> }
                             * @returns
                             */
                            setField(fieldName, data) {
                                const instance = basicFormItemMap.get(fieldName);

                                if (!instance) {
                                    const error = new Error('表单中没有 "' + fieldName + '" 组件');
                                    console.warn(error);
                                    return false;
                                }

                                instance.setField(data);
                            },
                            /**
                             * set fields value and errors(参考 antd@3.x setFields)
                             * @param {object} fieldObject { [fieldName: string]: { value?: any, errors?: Array<Error> } }
                             */
                            setFields(fieldObject) {
                                for (const fieldName in fieldObject) {
                                    this.setField(fieldName, fieldObject[fieldName]);
                                }
                            }
                        };

                        return <WrapperComponent {...nextProps} />;
                    }
                }
            }
        },
        // Form Item set value.
        saveBasicFormItem(name, instance) {
            const basicFormItemMap = basicFormMap.get(instance.context.symbol);
            basicFormItemMap.set(name, instance);
        },
        resetFields() {},

        /**
         * BasicForm instance
         * @returns {boolean}
         */
         clearForm(instance) {
            const basicFormItemMap = basicFormMap.get(instance.context.symbol);
            basicFormItemMap.clear();
        },

        clearFields() {
            basicFormMap.clear();
        }
    };
}

export default formWrapper();
