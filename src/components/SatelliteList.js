import React, {Component} from 'react';
import {List, Avatar, Button, Checkbox, Spin} from "antd";


import satellite from "../assets/images/satellite.svg";

class SatelliteList extends Component {

    state = {
        selected: [],
    }


    render() {
        //返回值为空 就显示空
        const satList = this.props.satInfo ? this.props.satInfo.above : [];
        const {isLoad} = this.props; //在下面 加！是spin 一直转，可以调位置


        return (
            <div className="sat-list-box">
                <div className="btn-container">
                    < Button className="sat-list-btn"
                             type="primary"
                             size="large"
                             onClick={this.onShowSatMap}

                    >Track on the map</Button>
                </div>

                <hr/>

                {isLoad ?
                    <div className="spin-box">
                        <Spin tip="Loading..."/>
                    </div>

                    : <List
                        className="sat-list"
                        itemLayout="horizontal"
                        size="small"
                        dataSource={satList}
                        renderItem={item => (
                            <List.Item
                                actions={[
                                    /*自定义了一个  属性dataInfo 为了方便 区分不同的卫星，后面给map用  */
                                    <Checkbox dataInfo={item} onChange={this.onChange}/>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar size={50} src={satellite}/>}
                                    title={<p>{item.satname}</p>}
                                    description={`Launch Date: ${item.launchDate}`}
                                />
                            </List.Item>
                        )}

                    />


                }


            </div>

        );
    }

    onChange = e => {
        console.log(e.target)
        //get sat info and check status
        const {dataInfo, checked} = e.target;
        const {selected} = this.state;

        //add or remove the sat to satlist
        const list = this.addOrRemove(dataInfo, checked, selected);

        //setState -> selected
        this.setState({selected: list})

    }


    addOrRemove = (item, status, list) => {
        //case1: checked status is true
        //item not in the list=>add it
        //item is in the list =>do nothing
        const found = list.some(entry => entry.satid === item.satid);
        if (status && !found) {
            // list.push(item)
            list = [...list, item]

        }
        //case2: checked status is false
        //item not in the list=>do nothing
        //item is in the list => remove it
        /**
         * JS口诀：
         * 删除用filter； 遍历用map； 增加用...
         *
         * */

        if (!status && found) {
            list = list.filter(entry => {
                return entry.satid !== item.satid;
            });
        }
        return list;
    }

    onShowSatMap = () => {
        this.props.onShowMap(this.state.selected);// 将selected的数据 发回 父组件 main
    };


}

export default SatelliteList;