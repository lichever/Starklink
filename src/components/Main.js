import React, {Component} from 'react';
import axios from "axios";

import {Row, Col} from 'antd';

import SatSetting from './SatSetting'
import SatelliteList from './SatelliteList';
import {NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY} from "../constants";
import WorldMap from './WorldMap'


class Main extends Component {

    constructor() {
        super();
        this.state = {
            satInfo: null,
            setting: null,
            satList: [],

            isLoadingList: false
        };
    }


    /* antd 默认一行24col，用span 来分*/
    render() {

        const { isLoadingList, satInfo, satList, setting } = this.state;
        return (


            <Row className="main">
                <Col span={8} className="left-side">
                    <SatSetting onShow={this.showNearbySatellite}/>
                    <SatelliteList
                        satInfo={satInfo}
                        isLoad={isLoadingList}
                        onShowMap={this.showMap}
                    />
                </Col>
                <Col span={16} className="right-side">
                    <WorldMap satData={satList} observerData={setting} />

                </Col>
            </Row>


        );
    }


    showNearbySatellite = (setting) => {

        // console.log(setting)

        this.setState({//从child 拿回 用户 输入的数据
            setting: setting
        })


        this.fetchSatellite(setting);//去服务器拿数据 存到自己的state：satInfo里面，再通过props传给子组件SatelliteList
    }


    fetchSatellite = setting => {
        const {latitude, longitude, elevation, radius} = setting;
        const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${radius}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;
        // const url = `https://api.n2yo.com/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${radius}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;

        this.setState({
            isLoadingList: true
        });

        axios
            .get(url)
            .then(response => {
                console.log(response.data);
                this.setState({
                    satInfo: response.data,
                    isLoadingList: false
                });
            })
            .catch(error => {
                console.log("err in fetch satellite -> ", error);
            });


    };


    showMap = selected => {
        this.setState(preState => ({
            ...preState,  //其他状态不变

            isLoadingMap: true,
            satList: [...selected]//浅copy 一个 新的 数组

        }));
    };

}

export default Main;