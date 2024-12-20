"use client";

import { useState, useEffect } from "react";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveRadar } from "@nivo/radar";

interface Order {
  id: number;
  supplier_id: number;
  quantity: number;
  price: number;
  total: number;
  date?: string;
  supplier: {
    id: number;
    name: string;
  };
}

interface SupplierStats {
  [key: string]: number;
}

interface MonthlyDataPoint {
  x: string;
  y: number;
  isCurrentMonth: boolean;
}

interface MonthlyChartData {
  id: string;
  data: MonthlyDataPoint[];
}

interface SupplierOrderData {
  발주건수: number;
  발주금액: number;
}

interface SupplierBarDataPoint {
  supplier: string;
  발주건수: number;
  발주금액: number;
  [key: string]: string | number;
}

interface CategoryStats {
  발주건수: number;
  발주금액: number;
}

interface CategoryDataPoint {
  category: string;
  발주건수: number;
  발주금액: number;
}

const theme = {
  background: "transparent",
  textColor: "#333333",
  fontSize: 11,
  axis: {
    domain: {
      line: {
        stroke: "#777777",
        strokeWidth: 1,
      },
    },
    ticks: {
      line: {
        stroke: "#777777",
        strokeWidth: 1,
      },
    },
  },
  grid: {
    line: {
      stroke: "#dddddd",
      strokeWidth: 1,
    },
  },
};

export default function Dashboard() {
  const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
  const [supplierData, setSupplierData] = useState<{ id: string; label: string; value: number; }[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  // const [calendarData, setCalendarData] = useState<{ date: string; value: number; }[]>([]);
  const [supplierStats, setSupplierStats] = useState<SupplierStats>({});
  const [supplierBarData, setSupplierBarData] = useState<SupplierBarDataPoint[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [currentMonth, setCurrentMonth] = useState("");
  const [lastMonth, setLastMonth] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:8000/orders/");
        const data: Order[] = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    fetchOrders();
  }, []);

  // Process data on client side
  useEffect(() => {
    if (!isClient || orders.length === 0) return;

    const now = new Date();
    const currentMonthStr = now.toLocaleDateString("ko-KR", {
      month: "long",
      timeZone: "Asia/Seoul",
    });
    const lastMonthStr = new Date(
      now.getFullYear(),
      now.getMonth() - 1
    ).toLocaleDateString("ko-KR", { month: "long", timeZone: "Asia/Seoul" });

    setCurrentMonth(currentMonthStr);
    setLastMonth(lastMonthStr);

    if (!orders.length) {
      // 데이터가 없을 때 기본 데이터 설정
      setMonthlyData([
        {
          id: "발주건수",
          data: []
        },
        {
          id: "발주금액",
          data: []
        }
      ]);
      return;
    }

    // Get current month for highlighting
    const nowDate = new Date();
    const currentMonthNum = nowDate.getMonth() + 1;  // 1-based month

    // Process monthly data
    const monthlyOrderData = orders.reduce((acc: Record<number, SupplierOrderData>, order) => {
      if (!order.date) {
        return acc;
      }
      const date = new Date(order.date);
      const month = date.getMonth() + 1; // 1-based month
      if (!acc[month]) {
        acc[month] = { 발주건수: 0, 발주금액: 0 };
      }
      acc[month].발주건수 += 1;
      acc[month].발주금액 += Math.round(order.total / 10000); // Convert to 만원
      return acc;
    }, {});

    // Convert to nivo line chart format
    const processedData = Object.entries(monthlyOrderData).map(([month, data]: [string, SupplierOrderData]) => {
      return {
        x: `${month}월`,  
        발주건수: data.발주건수,
        발주금액: data.발주금액,
        isCurrentMonth: parseInt(month) === currentMonthNum
      };
    });

    // Sort by month
    processedData.sort((a, b) => parseInt(a.x) - parseInt(b.x));

    const monthlyDataFormatted = [
      {
        id: "발주건수",
        data: processedData.map((d) => ({
          x: d.x,
          y: d.발주건수,
          isCurrentMonth: d.isCurrentMonth
        }))
      },
      {
        id: "발주금액",
        data: processedData.map((d) => ({
          x: d.x,
          y: d.발주금액,
          isCurrentMonth: d.isCurrentMonth
        }))
      }
    ];

    setMonthlyData(monthlyDataFormatted);

    // Process supplier data
    const supplierStats = orders.reduce((acc: SupplierStats, order) => {
      const supplierName = order.supplier.name;
      if (!acc[supplierName]) {
        acc[supplierName] = 0;
      }
      acc[supplierName] += Math.round(order.total / 10000); // Convert to 만원
      return acc;
    }, {});

    const supplierDataFormatted = Object.entries(supplierStats)
      .sort((a, b) => b[1] - a[1])  // Sort by amount in descending order
      .map(([supplier, total]) => ({
        id: supplier,
        label: supplier,
        value: total,
      }));

    // Process supplier order count data
    const supplierOrderCounts = orders.reduce((acc: Record<string, SupplierOrderData>, order) => {
      const supplierName = order.supplier.name;
      if (!acc[supplierName]) {
        acc[supplierName] = { 발주건수: 0, 발주금액: 0 };
      }
      acc[supplierName].발주건수 += 1;
      acc[supplierName].발주금액 += order.total;
      return acc;
    }, {});

    const supplierBarData = Object.entries(supplierOrderCounts)
      .map(([supplier, data]: [string, SupplierOrderData]) => ({
        supplier,
        발주건수: data.발주건수,
        발주금액: Math.round(data.발주금액 / 10000),
      }))
      .sort((a, b) => b.발주건수 - a.발주건수)
      .slice(0, 10); // Limit to top 10 suppliers to prevent overcrowding

    // Process category data
    const categoryStats = orders.reduce((acc: Record<string, CategoryStats>, order) => {
      const category = "식자재"; // Replace with actual category
      if (!acc[category]) {
        acc[category] = { 발주건수: 0, 발주금액: 0 };
      }
      acc[category].발주건수 += 1;
      acc[category].발주금액 += order.total;
      return acc;
    }, {});

    const categoryDataFormatted = Object.entries(categoryStats).map(
      ([category, stats]: [string, CategoryStats]) => ({
        category,
        발주건수: stats.발주건수,
        발주금액: Math.round(stats.발주금액 / 10000),
      })
    );

    setSupplierData(supplierDataFormatted);
    setCategoryData(categoryDataFormatted);
    setSupplierBarData(supplierBarData);
    setSupplierStats({
      [currentMonthStr]: monthlyOrderData[new Date().getMonth() + 1]?.발주건수 || 0,
      [lastMonthStr]: monthlyOrderData[new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth() + 1]?.발주건수 || 0,
    });
  }, [isClient, orders]);

  return (
    <div className="grid grid-cols-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 md:grid-cols-2 gap-6 animate-fadeIn">
      {/* 월별 발주 추이 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-800 mb-4">
            월별 발주 추이
          </div>
          <div className="text-sm font-normal text-gray-500 ml-2">
            (금액단위: 만원)
          </div>
        </div>
        <div className="h-[390px]">
          <ResponsiveLine
            data={monthlyData}
            
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
            xScale={{ type: "point" }}
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
              stacked: false,
            }}
            colors={["#61cdbb", "#f47560"]}
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
            pointSize={12}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            pointLabelYOffset={-12}
            useMesh={true}
            enablePoints={true}
            markers={[
              {
                axis: 'x',
                value: `${new Date().getMonth() + 1}월`,
                lineStyle: { stroke: '#b4b4b4', strokeWidth: 2, strokeDasharray: '4 4' },
                legend: '현재 월',
                legendOrientation: 'vertical',
                textStyle: { fill: '#666' }
              }
            ]}
            theme={{
              ...theme,
              tooltip: {
                container: {
                  background: "#333",
                  color: "#fff",
                  fontSize: "12px",
                  borderRadius: "4px",
                  padding: "8px 12px",
                },
              },
              labels: {
                text: {
                  fill: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                },
              },              
            }}
            legends={[
              {
                anchor: "top-right",
                direction: "column",
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 0,
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 1,
                symbolSize: 14,
                symbolShape: "circle",
                symbolBorderColor: "rgba(0, 0, 0, .5)",
                itemTextColor: "#333",

                data: [
                  {
                    id: "발주건수",
                    label: "발주건수",
                    color: "#61cdbb",
                  },
                  {
                    id: "발주금액",
                    label: "발주금액",
                    color: "#f47560",
                  },
                ],

                effects: [
                  {
                    on: "hover",
                    style: {
                      itemTextColor: "#000",
                      symbolSize: 20,
                      itemBackground: "rgba(0, 0, 0, .03)",
                    },
                  },
                ],
              },
            ]}
          
            animate={true}
          />
        </div>
      </div>

      {/* 구입처별 발주 금액 분포 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-800 mb-4">
            구입처별 발주 금액 분포
          </div>
          <div className="text-sm font-normal text-gray-500 ml-2">
            (금액단위:만원)
          </div>
        </div>
        <div className="h-[390px]">
          <ResponsivePie
            data={supplierData}
            margin={{ top: 30, right: 160, bottom: 30, left: 60 }} // 오른쪽 여백 증가
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={{ scheme: "nivo" }}
            borderWidth={1}
            borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: "color" }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{
              from: "color",
              modifiers: [["darker", 4]],
            }}
            theme={{
              tooltip: {
                container: {
                  background: "#333",
                  color: "#fff",
                  fontSize: "12px",
                  borderRadius: "4px",
                  padding: "8px 12px",
                },
              },
              labels: {
                text: {
                  fill: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                },
              },
            }}
            legends={[
              {
                anchor: "right", // 레전드를 차트 오른쪽에 배치
                direction: "column", // 세로로 배치
                justify: false,
                translateX: 120, // 오른쪽으로 여유 공간 추가
                translateY: 0,
                itemsSpacing: 2, // 항목 간 간격
                itemWidth: 100,
                itemHeight: 20,
                itemTextColor: "#333",
                itemDirection: "left-to-right",
                itemOpacity: 1,
                symbolSize: 14,
                symbolShape: "circle",

                data: [
                  {
                    id: "발주건수",
                    label: "발주건수",
                    color: "#61cdbb",
                  },
                  {
                    id: "발주금액",
                    label: "발주금액",
                    color: "#f47560",
                  },
                ],
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemTextColor: "#000",
                      symbolSize: 20,
                      itemBackground: "rgba(0, 0, 0, .03)",
                    },
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      {/* 구입처별 발주 현황  */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-800 mb-4">
            구입처별 발주 현황
          </div>

          <div className="text-sm font-normal text-gray-500 ml-2">
            (금액단위: 만원)
          </div>
        </div>
        <div className="h-[390px]">
          {isClient && supplierBarData.length > 0 && (
            <ResponsiveBar
              data={supplierBarData}
              keys={["발주건수", "발주금액"]}
              indexBy="supplier"
              margin={{ top: 50, right: 130, bottom: 55, left: 60 }}
              padding={0.2}
              groupMode="grouped"
              valueScale={{
                type: "linear",
                min: 0,
                max: "auto",
              }}
              indexScale={{ type: "band", round: true }}
              colors={["#61cdbb", "#f47560"]}
              borderColor={{
                from: "color",
                modifiers: [["darker", 1.6]],
              }}
              enableLabel={true}
              label={(d) => String(d.value)}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: "구입처",
                legendPosition: "middle",
                legendOffset: 50,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "발주 건수 (EA)",
                legendPosition: "middle",
                legendOffset: -40,
              }}
              axisRight={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "발주 금액 (만원)",
                legendPosition: "middle",
                legendOffset: 40,
                format: (value) => `${value.toLocaleString()}`,
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              theme={{
                tooltip: {
                  container: {
                    background: "#333",
                    color: "#fff",
                    fontSize: "12px",
                    borderRadius: "4px",
                    padding: "8px 12px",
                  },
                },
                labels: {
                  text: {
                    fill: "#fff",
                    fontSize: 12,
                    fontWeight: 500,
                  },
                },
              }}
              legends={[
                
                {
                  dataFrom: "keys",
                  anchor: "top-right",
                  direction: "column",
                  justify: false,
                  translateX: 155,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: "left-to-right",
                  itemOpacity: 1,
                  symbolSize: 14,
                  symbolShape: "circle",

                  data: [
                    {
                      id: "발주건수",
                      label: "발주건수",
                      color: "#61cdbb",
                    },
                    {
                      id: "발주금액",
                      label: "발주금액",
                      color: "#f47560",
                    },
                  ],
                  effects: [
                    {
                      on: "hover",
                      style: {
                        itemTextColor: "#000",
                        symbolSize: 20,
                        itemBackground: "rgba(0, 0, 0, .03)",
                      },
                    },
                  ],
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* 지난달 발주 현황 비교 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-800 mb-4">
            지난달 발주 현황 비교
          </div>
          <div className="text-sm font-normal text-gray-500 ml-2">
            (금액단위: 만원)
          </div>
        </div>
        <div className="h-[390px]">
          {isClient && monthlyData.length > 0 && (
            <ResponsiveRadar
              data={[
                {
                  metric: "발주건수",
                  이번달:
                    monthlyData[0]?.data.find(
                      (d: { x: string }) => d.x === currentMonth
                    )?.y || 0,
                  지난달:
                    monthlyData[0]?.data.find(
                      (d: { x: string }) => d.x === lastMonth
                    )?.y || 0,
                },
                {
                  metric: "발주금액",
                  이번달:
                    monthlyData[1]?.data.find(
                      (d: { x: string }) => d.x === currentMonth
                    )?.y || 0,
                  지난달:
                    monthlyData[1]?.data.find(
                      (d: { x: string }) => d.x === lastMonth
                    )?.y || 0,
                },
                {
                  metric: "공급업체수",
                  이번달: supplierStats[currentMonth] || 0,
                  지난달: supplierStats[lastMonth] || 0,
                },
              ]}
              keys={["이번달", "지난달"]}
              indexBy="metric"
              valueFormat={(value) => value.toLocaleString("ko-KR")}
              margin={{ top: 70, right: 80, bottom: 20, left: 80 }}
              borderColor={{ from: "color", modifiers: [] }}
              gridLabelOffset={36}
              dotSize={8}
              dotColor={{ theme: "background" }}
              dotBorderWidth={2}
              colors={["#61cdbb", "#f47560"]}
              theme={{
                tooltip: {
                  container: {
                    background: "#333",
                    color: "#fff",
                    fontSize: "12px",
                    borderRadius: "4px",
                    padding: "8px 12px",
                  },
                },
                labels: {
                  text: {
                    fill: "#fff",
                    fontSize: 12,
                    fontWeight: 500,
                  },
                },
              }}
              legends={[
                {
                  anchor: "top-right",
                  direction: "column",
                  translateX: -50,
                  translateY: -40,
                  itemWidth: 85,
                  itemHeight: 20,
                  itemTextColor: "#333",
                  itemOpacity: 1,
                  symbolSize: 14,
                  symbolShape: "circle",
                  effects: [
                    {
                      on: "hover",
                      style: {
                        itemTextColor: "#000",
                        symbolSize: 20,
                        itemBackground: "rgba(0, 0, 0, .03)",
                      },
                    },
                  ],
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
