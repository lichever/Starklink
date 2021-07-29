import React, {Component} from 'react';
import axios from 'axios';
import {feature} from 'topojson-client'; //convert topjson to geojson
import {geoKavrayskiy7} from 'd3-geo-projection';//画 地图形状
import {geoGraticule, geoPath} from 'd3-geo';//画 线的  bound
import {select as d3Select} from 'd3-selection';// 用来打点 操作

import {schemeCategory10} from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import {timeFormat as d3TimeFormat} from "d3-time-format";

import {SAT_API_KEY, SATELLITE_POSITION_URL, WORLD_MAP_URL} from "../constants";
import {Spin} from 'antd'

const width = 960;
const height = 600;


/**
 * 自己用原生js做了一个map的组件，也可以用现成的react map library
 *
 * */

class WorldMap extends Component {
    constructor() {
        super();
        this.state = {
            isLoading: false,
            isDrawing: false

        }

        this.color = d3Scale.scaleOrdinal(schemeCategory10);// 输入调色板

        this.map = null;//存和地图相关的 数据 来自 generate map  最后传给track 画图用
        this.refMap = React.createRef();//{current:null}    在react中 去拿到非受控组件的 DOM
        this.refTrack = React.createRef();


    }

    componentDidMount() {
        //fetch world map data
        axios.get(WORLD_MAP_URL)
            .then(res => {
                const {data} = res;

                //convert topjson to geojson
                const land = feature(data, data.objects.countries).features;
                this.generateMap(land);
            })
            .catch(err => console.log('err in fecth world map data ', err))
    }

//因为checked和unchecked的数据会随时变，也就是传进来的props也会变，所以属于update stage
    componentDidUpdate(prevProps, prevState, snapshot) {

        //1. get duration, lat, longitude... from the setting
        //     console.log(this.props)
        //     console.log(prevProps)


        if (this.props.satData.length != 0 && prevProps.satData !== this.props.satData) {
            //不加后半句，会一直update !!! 因为下面有setState

            const {
                latitude,
                longitude,
                elevation,
                duration
            } = this.props.observerData;


            const endTime = duration * 60;// 是为了加速，实际默认取10s 实际取600s 然后每隔60s 打一个点

            this.setState({ //开始拿数据
                isLoading: true
            });

            //2. fetch selected sat data
            // configs=>url
            const urls = this.props.satData.map(sat => {
                const {satid} = sat;
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;

                return axios.get(url);
            });

            Promise.all(urls) //async 操作；axios里的concurrent request
                .then(res => {
                    const arr = res.map(sat => sat.data);//数据是在 .data.positions

                    //拿到了数据 设置当前state isDrawing为true
                    this.setState({
                        isLoading: false,
                        isDrawing: true
                    });

                    //case1: 之前的state的 isDrawing is false -> not drawing=> draw
                    if (!prevState.isDrawing) {
                        this.track(arr);
                    } else {

                        //case2: 之前的state的 isDrawing is true-> is drawing=>hint
                        const oHint = document.getElementsByClassName("hint")[0];
                        oHint.innerHTML =
                            "Please wait for these satellite animation to finish before selection new ones!";  //在div里面输入
                    }
                })
                .catch(e => {


                    console.log("err in fetch satellite position -> ", e.message);
                });
        }
    }


    track = data => {
        // if (!data[0].hasOwnProperty("positions")) {//判断下positions数据是不是空，这里取巧只
        //     throw new Error("no position data");
        //     // return;
        // }


        if (data.length == 0) {
            throw new Error("no position data");
        }

        for (let j = 0; j < data.length; j++) {//选中的多个卫星
            if (!data[j].hasOwnProperty("positions") || data[j].positions.length == 0) {//判断下 有某个选中的 卫星 的positions数据是空
                throw new Error("no position data");
            }
        }


        const len = data[0].positions.length;//总的点数，eg，10*60
        const {context2} = this.map;//在 tracking map 上画

        let now = new Date();

        let i = 0;// 当前 打点的 index

        // 每隔一秒打一个点(但其实是每隔一分钟)
        let timer = setInterval(() => {
            let ct = new Date();

            let timePassed = i === 0 ? 0 : ct - now;

            let time = new Date(now.getTime() + 60 * timePassed);


            //clear last track path
            context2.clearRect(0, 0, width, height);


            //display time on map2
            context2.font = "bold 14px sans-serif";
            context2.fillStyle = "#333";
            context2.textAlign = "center";
            context2.fillText(d3TimeFormat(time), width / 2, 10);

            //打点完毕
            if (i >= len) {
                clearInterval(timer);
                this.setState({isDrawing: false});// 说明画完了
                const oHint = document.getElementsByClassName("hint")[0];//画完了，让hint消失
                oHint.innerHTML = "";
                return;
            }

            //对每个卫星 打点画图
            data.forEach(sat => {
                const {info, positions} = sat;
                this.drawSat(info, positions[i]);
            });

            i += 60;//跳60个点

        }, 1000);
    };


    drawSat = (sat, pos) => {
        const {satlongitude, satlatitude} = pos;

        if (!satlongitude || !satlatitude) return;

        const {satname} = sat;
        const nameWithNumber = satname.match(/\d+/g).join("");//加join 是为了形成string  不然是object array
        //match： 存放匹配结果的数组。该数组的内容依赖于 regexp 是否具有全局标志 g。


        const {projection, context2} = this.map;
        const xy = projection([satlongitude, satlatitude]);

        // console.log(xy)

        context2.fillStyle = this.color(nameWithNumber);// 保证获取 不同的 时间。
        context2.beginPath();
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
        context2.fill();

        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14);
    };


    generateMap(land) {
        const projection = geoKavrayskiy7()
            .scale(170)
            .translate([width / 2, height / 2])
            .precision(.1);


        const canvas = d3Select(this.refMap.current)
            .attr("width", width)//因为用d3在canvas画图所以 在这里设置宽高 而不是在css
            .attr("height", height);

        const canvas2 = d3Select(this.refTrack.current)
            .attr("width", width)
            .attr("height", height);

        let context = canvas.node().getContext("2d");
        let context2 = canvas2.node().getContext("2d");

        let path = geoPath()
            .projection(projection)
            .context(context);  //将projection 和 canvas 联系起来

        const graticuleGenerator = geoGraticule();
        const graticules = graticuleGenerator();

        land.forEach(ele => {
            context.fillStyle = '#B3DDEF';//填充style
            context.strokeStyle = '#000';//画线style
            context.globalAlpha = 0.7;//灰度？
            context.beginPath();
            path(ele);
            context.fill();
            context.stroke();

            context.strokeStyle = 'rgba(220, 220, 220, 0.1)';
            context.beginPath();
            path(graticules);//画经纬度
            context.lineWidth = 0.1;
            context.stroke();

            context.beginPath();
            context.lineWidth = 0.5;
            path(graticuleGenerator.outline());
            context.stroke();
        })

        this.map = {
            projection: projection,
            graticule: graticuleGenerator,
            context: context,
            context2: context2
        }
    }

    render() {

        const {isLoading} = this.state;

        return (
            <div className="map-box">
                {isLoading ? (
                    <div className="spinner">
                        <Spin tip="Loading..." size="large"/>
                    </div>
                ) : null}

                <canvas className="map" ref={this.refMap}/>
                <canvas className="track" ref={this.refTrack}/>

                <div className="hint"></div>

            </div>
        );
    }


}

export default WorldMap;
