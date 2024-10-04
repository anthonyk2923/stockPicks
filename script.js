let stockData = []; // Declare global stockData variable
let sortDirection = {
  ticker: 1,
  name: 1,
  price: 1,
  smartScore: 1,
  change: 1,
  marketCap: 1,
  bestConsensus: 1,
  pe: 1,
  buzz: 1,
  targetPrice: 1,
  investorSentiment: 1,
  targetPricePercentChange: 1, // Added to sort direction
};

function calculateAveragePercentChange() {
  if (stockData.length === 0) return;

  let wins = 0,
    losses = 0;
  const totalPercentChange = stockData.reduce((sum, stock) => {
    const percentChange = Number(stock.change.percent) || 0;
    if (percentChange > 0) {
      wins++;
    } else if (percentChange < 0) {
      losses++;
    }
    return sum + percentChange;
  }, 0);

  const averagePercentChange = (totalPercentChange / stockData.length).toFixed(
    2
  );

  const averageChangeElement = document.getElementById('averageChange');
  if (averageChangeElement) {
    averageChangeElement.innerHTML = `Total Change: ${averagePercentChange}%, Wins: ${wins}, Losses: ${losses}`;
  }
}

function formatMarketCap(value) {
  let formattedValue, companyClass;
  if (value >= 1e12) {
    formattedValue = (value / 1e12).toFixed(1) + 'T';
    companyClass = 'mega cap';
  } else if (value >= 1e9) {
    formattedValue = (value / 1e9).toFixed(1) + 'B';
    companyClass = 'large cap';
  } else if (value >= 1e6) {
    formattedValue = (value / 1e6).toFixed(1) + 'M';
    companyClass = 'mid cap';
  } else if (value >= 1e3) {
    formattedValue = (value / 1e3).toFixed(1) + 'K';
    companyClass = 'small cap';
  } else {
    formattedValue = value.toString();
    companyClass = 'micro cap';
  }
  return `${formattedValue} (${companyClass})`;
}

function formatConsensus(consensus) {
  if (!consensus) return 'N/A';
  const consensusMapping = {
    strongBuy: 'Strong Buy',
    buy: 'Buy',
    hold: 'Neutral',
    sell: 'Sell',
    strongSell: 'Strong Sell',
  };
  const consensusValue =
    consensus.id in consensusMapping
      ? consensusMapping[consensus.id]
      : 'Unknown';
  return `${consensusValue} (${consensus.total} Total)`;
}

function formatTargetPrice(price, targetPrice) {
  if (targetPrice === 'N/A') return { value: 'N/A', percentChange: 0 };
  const percentChange = (((targetPrice - price) / price) * 100).toFixed(2);
  return {
    value: `$${targetPrice.toFixed(2)} (${percentChange}%)`,
    percentChange: parseFloat(percentChange),
  };
}

function sortTable(column) {
  const arrowId = column + '-arrow';
  stockData.sort((a, b) => {
    let result = 0;

    if (
      column === 'price' ||
      column === 'smartScore' ||
      column === 'pe' ||
      column === 'targetPrice'
    ) {
      result = a[column] - b[column];
    } else if (column === 'change') {
      result = a.change.percent - b.change.percent;
    } else if (column === 'marketCap') {
      result = a.marketCap - b.marketCap;
    } else if (column === 'buzz') {
      result = a.buzz - b.buzz; // Sort buzz numerically
    } else if (column === 'targetPricePercentChange') {
      // Sort by target price percent change
      result = a.targetPrice.percentChange - b.targetPrice.percentChange;
    } else {
      result = a[column].localeCompare(b[column]);
    }

    return result * sortDirection[column];
  });

  // Toggle sort direction
  sortDirection[column] *= -1;

  // Update arrow direction
  const arrow = document.getElementById(arrowId);
  arrow.innerHTML = sortDirection[column] === 1 ? '↑' : '↓';

  // Clear the table body and repopulate with sorted data
  const tableBody = document
    .getElementById('stockTable')
    .querySelector('tbody');
  tableBody.innerHTML = ''; // Clear previous rows

  stockData.forEach((stock) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${stock.ticker}</td>
      <td>${stock.name}</td>
      <td>${stock.price.toFixed(2)}</td>
      <td>${stock.smartScore}</td>
      <td class="${stock.change.percent >= 0 ? 'positive' : 'negative'}">
        $${stock.change.dollar} (${
      stock.change.percent
    }%) <!-- Display percentage -->
      </td>
      <td>${formatMarketCap(stock.marketCap)}</td>
      <td>${stock.bestConsensus}</td>
      <td class="${
        typeof stock.pe === 'number' && stock.pe < 0 ? 'negative' : ''
      }">
        ${typeof stock.pe === 'number' ? stock.pe.toFixed(2) : stock.pe}
      </td>
      <td>${
        typeof stock.buzz === 'number'
          ? (stock.buzz * 100).toFixed(2) + '%'
          : stock.buzz
      }</td> <!-- Convert buzz to percentage -->
      <td style="color: ${
        stock.targetPrice.percentChange > 0 ? 'green' : 'purple'
      };">${stock.targetPrice.value}</td>
      <td>${stock.investorSentiment}</td>`;
    tableBody.appendChild(row);
  });
}

fetch(
  'https://tr-cdn.tipranks.com/research/prod/screener/analysts-top-stocks/payload.json'
)
  .then((response) => response.json())
  .then((data) => {
    stockData = data.TopRatedStocks.data.stocks.map((i) => {
      const targetPriceValue =
        i.analystRatings?.bestConsensus?.priceTarget?.value || 'N/A';
      const targetPriceData = formatTargetPrice(i.price, targetPriceValue);
      return {
        ticker: i.ticker || 'N/A',
        name: i.name || 'N/A',
        price: i.price || 0,
        smartScore: i.smartScore.value || 'N/A',
        change: i.change
          ? {
              percent: (i.change.percent * 100).toFixed(2), // Convert to percentage
              dollar: i.change.amount ? i.change.amount.toFixed(2) : 0,
            }
          : { percent: 0, dollar: 0 },
        marketCap: i.marketCap || 'N/A',
        bestConsensus:
          i.analystRatings && i.analystRatings.bestConsensus
            ? formatConsensus(i.analystRatings.bestConsensus)
            : 'N/A',
        pe: i.pe || 'N/A',
        buzz:
          i.newsSentiment && i.newsSentiment.buzz
            ? i.newsSentiment.buzz.value
            : 'N/A',
        targetPrice: targetPriceData,
        targetPricePercentChange: targetPriceData.percentChange,
        investorSentiment: i.investorActivity?.all?.sentiment || 'N/A',
      };
    });

    sortTable('ticker');
    calculateAveragePercentChange();
  })
  .catch((error) => {
    console.error('Error fetching stock data:', error);
  });
