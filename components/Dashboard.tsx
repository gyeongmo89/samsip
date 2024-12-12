'use client'

import { useState, useEffect } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveCalendar } from '@nivo/calendar'

// 더미 데이터 생성 함수들
const generateMonthlyData = () => {
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  return [
    {
      id: '총주문금액',
      data: months.map(month => ({
        x: month,
        y: Math.floor(Math.random() * 1000000) + 500000
      }))
    },
    {
      id: '주문건수',
      data: months.map(month => ({
        x: month,
        y: Math.floor(Math.random() * 50) + 20
      }))
    }
  ]
}

const generateSupplierData = () => {
  const suppliers = ['A상사', 'B물산', 'C식품', 'D유통', 'E상회']
  return suppliers.map(supplier => ({
    id: supplier,
    label: supplier,
    value: Math.floor(Math.random() * 1000000) + 100000
  }))
}

const generateCategoryData = () => {
  const categories = ['식자재', '음료', '소모품', '기타']
  return categories.map(category => ({
    category,
    '주문건수': Math.floor(Math.random() * 100) + 20,
    '주문금액': Math.floor(Math.random() * 1000000) + 100000
  }))
}

const generateCalendarData = () => {
  const data = []
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  
  for (let date = new Date(startDate); date <= today; date.setDate(date.getDate() + 1)) {
    data.push({
      day: date.toISOString().slice(0, 10),
      value: Math.floor(Math.random() * 100)
    })
  }
  return data
}

const theme = {
  background: 'transparent',
  textColor: '#333333',
  fontSize: 11,
  axis: {
    domain: {
      line: {
        stroke: '#777777',
        strokeWidth: 1
      }
    },
    ticks: {
      line: {
        stroke: '#777777',
        strokeWidth: 1
      }
    }
  },
  grid: {
    line: {
      stroke: '#dddddd',
      strokeWidth: 1
    }
  }
}

export default function Dashboard() {
  const [monthlyData, setMonthlyData] = useState(generateMonthlyData())
  const [supplierData, setSupplierData] = useState(generateSupplierData())
  const [categoryData, setCategoryData] = useState(generateCategoryData())
  const [calendarData, setCalendarData] = useState(generateCalendarData())

  useEffect(() => {
    const interval = setInterval(() => {
      setMonthlyData(generateMonthlyData())
      setSupplierData(generateSupplierData())
      setCategoryData(generateCategoryData())
      setCalendarData(generateCalendarData())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
      {/* 월별 주문 추이 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">월별 주문 추이</h3>
        <div className="h-[300px]">
          <ResponsiveLine
            data={monthlyData}
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
            }}
            pointSize={10}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
              }
            ]}
            theme={theme}
          />
        </div>
      </div>

      {/* 거래처별 주문 금액 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">거래처별 주문 금액</h3>
        <div className="h-[300px]">
          <ResponsivePie
            data={supplierData}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            theme={theme}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: 56,
                itemsSpacing: 0,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: '#999',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle',
              }
            ]}
          />
        </div>
      </div>

      {/* 카테고리별 주문 현황 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">카테고리별 주문 현황</h3>
        <div className="h-[300px]">
          <ResponsiveBar
            data={categoryData}
            keys={['주문건수', '주문금액']}
            indexBy="category"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            groupMode="grouped"
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={{ scheme: 'nivo' }}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
              }
            ]}
            theme={theme}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
          />
        </div>
      </div>

      {/* 일별 주문 현황 캘린더 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">일별 주문 현황</h3>
        <div className="h-[300px]">
          <ResponsiveCalendar
            data={calendarData}
            from={calendarData[0]?.day}
            to={calendarData[calendarData.length - 1]?.day}
            emptyColor="#eeeeee"
            colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            yearSpacing={40}
            monthBorderColor="#ffffff"
            dayBorderWidth={2}
            dayBorderColor="#ffffff"
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'row',
                translateY: 36,
                itemCount: 4,
                itemWidth: 42,
                itemHeight: 36,
                itemsSpacing: 14,
                itemDirection: 'right-to-left'
              }
            ]}
            theme={theme}
          />
        </div>
      </div>
    </div>
  )
}
