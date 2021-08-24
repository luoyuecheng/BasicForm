# Basic Form

基于`antd@3.x`版本的 Form 组件。由于直接使用`antd@3.x`版本的`Form`组件，在表单字段过多时，修改编辑或验证数据时，会出现在卡顿，页面响应缓慢等问题，故使用表单组件`Input`，`Select`等重新构建一个表单。

### 用法

```JavaScript
import React from 'react';
import BasicFormCustomer, { createBasicForm, BasicFormItem } from '@/components/BasicForm';

@createBasicForm.create()
export default class BasicFormDemo extends React.Component {
    formData = [
        {
            label: 'Program',
            name: 'mainProgram',
            type: 'select',
            disabled: true,
            options: [{ value: 1, label: 'Program 1' }],
            initialValue: 1
        },
        {
            label: 'E-Order #',
            name: 'epSoNumber',
            type: 'text'
        },
        {
            label: 'Customer PO#',
            name: 'custPoNo',
            type: 'text'
        },
        {
            label: 'Retailer PO#',
            name: 'retailerPoNo',
            type: 'text'
        },
        {
            label: 'Reference Number',
            name: 'refOrderNo',
            type: 'text'
        },
        {
            label: 'Creation Date',
            name: 'creationTime',
            type: 'range',
            format: 'DD/MM/YYYY'
        },
        {
            label: 'Order Status',
            name: 'epOrderStatus',
            type: 'render',
            render: (
                <AsyncSelect
                    filterOption
                    param={{ servicesApiType: 'listValues', listId: item.extraParams.listId }}
                    showArrow
                />
            )
        }
    ];

    handleSubmit = () => {
        this.props.basicForm.validateFields().then().catch();
    }

    render() {
        return (
            <BasicFormCustomer formData={this.formData} labelAlign="left">
                <div>
                    <BasicFormItem label="Order Status" required name="orderStatus">
                        <AsyncSelect
                            size={size}
                            filterOption
                            param={{ id: 1140, servicesApiType: 'listValues' }}
                            showArrow
                        />
                    </BasicFormItem>
                </div>
                <div className="text">
                    <Button className="btn-primary" onClick={this.handleSubmit}><I18nText value='ep2.global.btn.submit' /></Button>
                </div>
            </BasicFormCustomer>
        );
    }
}
```

在使用`@createBasicForm.create()`为组件添加装饰器或用`createBasicForm.create()(BasicFormDemo)`高阶组件后，会为组件`props`上集成一个`basicForm`对象，所有可用`Form API`都在这个对象中。

如果使用了`dva/connect`等数据流方案，需要先使用`createBasicForm.create()`高阶组件再使用`connect()`否则`createBasicForm.create`找不到要修饰的组件，组件中也获取不到`basicForm`。

使用`render`类型时，`render`字段后的组件需要暴露一个`onChange`方法，否则在`BasicForm`中无法监听到数据的变化。
