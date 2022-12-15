import Chart from "react-apexcharts";
import upArrow from "../assets/up-arrow.svg";
import downArrow from "../assets/down-arrow.svg";
import { useSelector } from "react-redux";
import { priceChartSelector } from "../store/selectors";
import Banner from "./Banner";
import { options, series } from "./PriceChart.config";

const PriceChart = () => {
  const symbols = useSelector((state) => state.tokens.symbols);
  const account = useSelector((state) => state.provider.account);
  const priceChart = useSelector(priceChartSelector);
  return (
    <div className="component exchange__chart">
      <div className="component__header flex-between">
        <div className="flex">
          <h2>{symbols && `${symbols[0]}/ ${symbols[1]}`}</h2>

          <div className="flex">
            {priceChart && priceChart.lastPriceChange === "+" ? (
              <img src={upArrow} alt="Arrow up" />
            ) : (
              <img src={downArrow} alt="Arrow down" />
            )}
            <span className="up"></span>
          </div>
        </div>
      </div>

      {!account ? (
        <Banner text={`Please connect to metamask`} />
      ) : (
        <Chart
          type="candlestick"
          options={options}
          series={priceChart ? priceChart.series : series}
          width="100%"
          height="100%"
        />
      )}
    </div>
  );
};

export default PriceChart;
