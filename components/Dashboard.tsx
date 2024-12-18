'use client'

import { useState, useEffect } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveCalendar } from '@nivo/calendar'
import { ResponsiveRadar } from '@nivo/radar'

interface Order {
  id: number
  supplier_id: number
  quantity: number
  price: number
  total: number
  date?: string
  supplier: {
    id: number
    name: string
  }
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
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [supplierData, setSupplierData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [calendarData, setCalendarData] = useState<any[]>([])
  const [supplierStats, setSupplierStats] = useState<any>({})
  const [isClient, setIsClient] = useState(false)
  const [currentMonth, setCurrentMonth] = useState('')
  const [lastMonth, setLastMonth] = useState('')

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const now = new Date()
    setCurrentMonth(now.toLocaleDateString('ko-KR', { month: 'long', timeZone: 'Asia/Seoul' }))
    setLastMonth(new Date(now.getFullYear(), now.getMonth() - 1)
      .toLocaleDateString('ko-KR', { month: 'long', timeZone: 'Asia/Seoul' }))
  }, [])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:8000/orders/')
        const orders: Order[] = await response.json()

        // Process monthly data
        const monthlyStats = orders.reduce((acc: any, order) => {
          if (!order.date) return acc
          const orderDate = new Date(order.date)
          const month = orderDate.toLocaleDateString('ko-KR', { month: 'long', timeZone: 'Asia/Seoul' })
          if (!acc[month]) {
            acc[month] = { 주문건수: 0, 주문금액: 0, suppliers: new Set() }
          }
          acc[month].주문건수 += 1
          acc[month].주문금액 += order.total
          acc[month].suppliers.add(order.supplier.name)
          return acc
        }, {})

        const monthlyDataFormatted = [
          {
            id: '주문건수',
            data: Object.entries(monthlyStats).map(([month, stats]: [string, any]) => ({
              x: month,
              y: stats.주문건수
            }))
          },
          {
            id: '주문금액',
            data: Object.entries(monthlyStats).map(([month, stats]: [string, any]) => ({
              x: month,
              y: Math.round(stats.주문금액 / 10000)
            }))
          }
        ]

        // Process supplier data
        const supplierStats = orders.reduce((acc: any, order) => {
          const supplierName = order.supplier.name
          if (!acc[supplierName]) {
            acc[supplierName] = 0
          }
          acc[supplierName] += order.total
          return acc
        }, {})

        const supplierDataFormatted = Object.entries(supplierStats).map(([supplier, total]) => ({
          id: supplier,
          label: supplier,
          value: Math.round(Number(total) / 10000) // Convert to 만원 단위
        }))

        // Process category data
        const categoryStats = orders.reduce((acc: any, order) => {
          const category = '식자재' // Replace with actual category
          if (!acc[category]) {
            acc[category] = { 주문건수: 0, 주문금액: 0 }
          }
          acc[category].주문건수 += 1
          acc[category].주문금액 += order.total
          return acc
        }, {})

        const categoryDataFormatted = Object.entries(categoryStats).map(([category, stats]: [string, any]) => ({
          category,
          주문건수: stats.주문건수,
          주문금액: Math.round(stats.주문금액 / 10000) // Convert to 만원 단위
        }))

        // Process calendar data
        const calendarStats = orders.reduce((acc: any, order) => {
          if (!order.date) return acc
          const date = new Date(order.date).toISOString().slice(0, 10)
          if (!acc[date]) {
            acc[date] = 0
          }
          acc[date] += order.total
          return acc
        }, {})

        const calendarDataFormatted = Object.entries(calendarStats).map(([date, total]) => ({
          day: date,
          value: Math.round(Number(total) / 10000) // Convert to 만원 단위
        }))

        setMonthlyData(monthlyDataFormatted)
        setSupplierData(supplierDataFormatted)
        setCategoryData(categoryDataFormatted)
        setCalendarData(calendarDataFormatted)

        // Set supplier stats for current and last month
        const currentMonthStats = monthlyStats[currentMonth]
        const lastMonthStats = monthlyStats[lastMonth]
        setSupplierStats({
          [currentMonth]: currentMonthStats?.suppliers.size || 0,
          [lastMonth]: lastMonthStats?.suppliers.size || 0
        })
      } catch (error) {
        console.error('Error fetching orders:', error)
      }
    }

    fetchOrders()
  }, [currentMonth, lastMonth])

  return (
    <div className="grid grid-cols-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 md:grid-cols-2 gap-6 animate-fadeIn">
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
                itemTextColor: '#999',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemTextColor: '#000'
                    }
                  }
                ]
              }
            ]}
            theme={theme}
            animate={true}
          />
        </div>
      </div>

      {/* 구입처 주문 금액 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">구입처별 주문 금액</h3>
        <div className="h-[300px]">
          <ResponsivePie
            data={supplierData}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={{ scheme: 'nivo' }}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 56,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: '#999',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemTextColor: '#000'
                    }
                  }
                ]
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
                itemTextColor: '#999',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemTextColor: '#000'
                    }
                  }
                ]
              }
            ]}
            theme={theme}
            isInteractive={true}
          />
        </div>
      </div>

      {/* 지난달 주문 현황 비교 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          지난달 주문 현황 비교
          <span className="text-sm font-normal text-gray-500 ml-2">(단위: 건, 만원, 개)</span>
        </h3>
        <div className="h-[400px]">
          {isClient && (
            <ResponsiveRadar
              data={[
                { 
                  metric: '주문건수', 
                  이번달: monthlyData[0]?.data.find((d: { x: string }) => d.x === currentMonth)?.y || 0,
                  지난달: monthlyData[0]?.data.find((d: { x: string }) => d.x === lastMonth)?.y || 0
                },
                { 
                  metric: '주문금액', 
                  이번달: monthlyData[1]?.data.find((d: { x: string }) => d.x === currentMonth)?.y || 0,
                  지난달: monthlyData[1]?.data.find((d: { x: string }) => d.x === lastMonth)?.y || 0
                },
                { 
                  metric: '공급업체수', 
                  이번달: supplierStats[currentMonth] || 0,
                  지난달: supplierStats[lastMonth] || 0
                },
              ]}
              keys={['이번달', '지난달']}
              indexBy="metric"
              valueFormat={(value) => value.toLocaleString('ko-KR')}
              margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
              borderColor={{ from: 'color', modifiers: [] }}
              gridLabelOffset={36}
              dotSize={8}
              dotColor={{ theme: 'background' }}
              dotBorderWidth={2}
              colors={['#61cdbb', '#f47560']}
              theme={{
                tooltip: {
                  container: {
                    background: '#333',
                    color: '#fff',
                    fontSize: '12px',
                    borderRadius: '4px',
                    padding: '8px 12px',
                  },
                },
                text: {
                  fontSize: 11,
                  fill: '#333333',
                },
                axis: {
                  ticks: {
                    text: {
                      fontSize: 10,
                      fill: '#666666',
                    },
                  },
                },
              }}
              legends={[
                {
                  anchor: 'top-left',
                  direction: 'row',
                  translateX: -50,
                  translateY: -40,
                  itemWidth: 85,
                  itemHeight: 20,
                  itemTextColor: '#666',
                  symbolSize: 12,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: '#000'
                      }
                    }
                  ]
                }
              ]}
            />
          )}
        </div>
      </div>
    </div>
  )
}
