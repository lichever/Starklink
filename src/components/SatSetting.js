import React, {Component} from 'react';
import {Form, Button, InputNumber} from 'antd';

/*这里用的是antd@3的版本，和proj1不一样v4，因为这里的form的hoc用法是在V3版本*/


class SatSettingForm extends Component {
    render() {

        // console.log(this.props)
        const {getFieldDecorator} = this.props.form;/*getFieldDecorator 验证表单作用 是高阶组件 HOC*/

        const formItemLayout = {
            labelCol: {
                xs: {span: 24},
                sm: {span: 11}
            },
            wrapperCol: {
                xs: {span: 24},
                sm: {span: 13}
            }
        };


        return (
            <Form {...formItemLayout} className="sat-setting" onSubmit={this.showSatellite} >
                <Form.Item
                    label="Longitude(degrees)" >

                    {
                        getFieldDecorator("longitude", {
                            rules: [
                                {
                                    pattern: new RegExp(/\d+/g),
                                    required: true,
                                    message: "Please input your Longitude"
                                }
                            ],

                            initialValue:70

                        })(<InputNumber min={-180} max={180}/*传入一个组件*/
                                        style={{width: "100%"}}
                                        placeholder="Please input Longitude"

                        />)

                    }

                </Form.Item>
                <Form.Item label="Latitude(degrees)">
                    {
                        getFieldDecorator("latitude", {
                            rules: [
                                {
                                    required: true,
                                    message: "Please input your Latitude"
                                }
                            ],

                            initialValue:-40

                        })(<InputNumber placeholder="Please input Latitude"
                                        min={-90} max={90}
                                        style={{width: "100%"}}
                        />)
                    }
                </Form.Item>
                <Form.Item label="Elevation(meters)">
                    {
                        getFieldDecorator("elevation", {
                            rules: [
                                {
                                    required: true,
                                    message: "Please input your Elevation"
                                }
                            ],

                            initialValue:100

                        })(<InputNumber placeholder="Please input Elevation"
                                        min={-413} max={8850}
                                        style={{width: "100%"}}
                        />)
                    }
                </Form.Item>
                <Form.Item label="Radius(degrees)">
                    {
                        getFieldDecorator("radius", {
                            rules: [
                                {
                                    required: true,
                                    message: "Please input your Altitude"
                                }
                            ],
                            initialValue:90

                        })(<InputNumber placeholder="Please input Radius"
                                        min={0} max={90}
                                        style={{width: "100%"}}
                        />)
                    }
                </Form.Item>
                <Form.Item label="Duration(secs)">
                    {
                        getFieldDecorator("duration", {
                            rules: [
                                {
                                    required: true,
                                    message: "Please input your Duration"
                                }
                            ],

                            initialValue:10

                        })(<InputNumber placeholder="Please input Duration" min={0} max={90} style={{width: "100%"}}/>)
                    }
                </Form.Item>
                <Form.Item className="show-nearby">
                    <Button type="primary" htmlType="submit" size="large" style={{textAlign: "center"}}>
                        Find Nearby Satellite
                    </Button>
                </Form.Item>


            </Form>


        );
    }

    showSatellite = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                // console.log('Received values of form: ', values);  values里面的key 是上面getFieldDecorator给的key
                this.props.onShow(values);//传值回 上层的父级  main 组件
            }
        });
    }

}

//这里是把传入高阶组件Form.create()(?), 然后在Form.create()里面会实例化SatSettingForm
//并通过props传入东西， 比如这里用到的form
//Form.create()(?)这里搞完会返回一个组件，也就是我们要用的，这里需要换个名字 暴露出去
const SatSetting = Form.create()(SatSettingForm);

export default SatSetting;