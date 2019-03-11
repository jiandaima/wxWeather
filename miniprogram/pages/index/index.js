//index.js
const app = getApp()
import { getPosition, getWeaterInfo, getEveryHoursWeather, getWeekWeather, getAirQuality, getWeatherLive } from '../../uitl/api'
import { weekEnum as weekday, airQuailtyLevel, arrForAirColor } from '../../uitl/utils'

Page({
  data: {
    bgImgUrl: 'https://7778-wx-lcy-001-7c4596-1258768646.tcb.qcloud.la/cloud.jpg?sign=c2ae35f4801b87899b6699469b943367&t=1552072527',
    location: {
      x: '116.40',
      y: '39.9',
      name: '北京市'
    },
    position: '正在获取位置...',
    todayData: {},
    tomorrowData: {},
    everyHourData: [],
    everyWeekData: [],
    airQuality: {},
    liveWeather: {}
  },

  onLoad: function () {
    wx.getLocation({
      type: 'gcj02',
      success: this.updateLocation,
      fail: err => {
        console.log(err)
      }
    })
  },

  updateLocation: function (res) {
    let { latitude: x, longitude: y, name } = res;
    let data = { location: { x, y, name: name || '北京市' } };
    this.setData(data);
    this.getLocation(x, y, name);
  },

  chooseLocation: function () {
    wx.chooseLocation({
      success: res => {
        let { latitude, longitude } = res
        let { x, y } = this.data.location
        if (latitude == x && longitude == y) {

        } else {
          this.updateLocation(res)
        }
      }
    })
  },

  getLocation: function (lat, lon, name) {
    wx.showLoading({
      title: "定位中",
      mask: true
    })
    getPosition(lat, lon, (res) => {
      if (res.statusCode == 200) {
        let response = res.data.result
        let addr = response.formatted_addresses.recommend || response.rough
        this.setData({
          position: addr
        })
        wx.hideLoading()
        this.getWeather(lat, lon)
        this.getAir(lat, lon)
        this.getHourWeather(lat, lon)
        this.getWeatherForWeek(lat, lon)
      }
    }, (err => {
      console.log(err)
      wx.hideLoading()
    }))
  },

  getWeather: function (lat, lon) {
    if (!lat || !lon) {
      return
    }
    getWeatherLive(lat, lon, res => {
      this.setData({
        liveWeather: res.data.HeWeather6[0].now
      })
    }, err => {
      console.log(err);
    })
  },
  getHourWeather: function (lat, lon) {
    if (!lat || !lon) {
      return
    }
    getEveryHoursWeather(lat, lon, res => {
      console.log(res)
      let data = res.data.HeWeather6[0].hourly;
      let arrData = [];
      data.forEach(item => {
        let d = {};
        d.time = item.time.split(" ")[1].split(":")[0];
        if (typeof d.time == 'string') {
          if (d.time.charAt(0) == '0') {
            let str = d.time;
            d.time = str.substring(1)
          }
        }
        d.cond = item.cond_txt;
        d.tmp = item.tmp;
        arrData.push(d);
      });
      this.setData({ everyHourData: arrData });
    }, err => {
      console.log(err)
    })
  },
  getWeatherForWeek: function (lat, lon) {
    if (!lat || !lon) {
      return
    }
    getWeekWeather(lat, lon, res => {
      let data = res.data.HeWeather6[0].daily_forecast;
      for (let i = 0; i < data.length; i++) {
        data[i].weekday = weekday[(new Date(data[i].date)).getDay()]
        let date = data[i].date;
        let arr = date.split('-')
        arr.shift()
        data[i].date = arr.join('/')
        data[i].dateTxt = `${arr[0]}月${arr[1]}日`
      }
      data[0].weekday = '今 天'
      data[1].weekday = '明 天'
      data[2].weekday = '后 天'
      this.setData({
        everyWeekData: data,
        todayData: data[0],
        tomorrowData: data[1]
      })
    }, fail => {

    })
  },
  getAir: function (lat, lon) {
    if (!lat || !lon) {
      return
    }
    getAirQuality(lat, lon, res => {
      let data = res.data.HeWeather6[0].air_now_city
      let value = data.aqi
      let keys = Object.keys(airQuailtyLevel)
      for(let i = 0;i < keys.length; i++) {
        if(Number(value) <= Number(keys[i])) {
          data.color = arrForAirColor[i];
          data.airText = airQuailtyLevel[keys[i]];
          break;
        }
      }
      this.setData({
        airQuality: data
      })
    }, err => {
      console.log(err)
    })
  }
})