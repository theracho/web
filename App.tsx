import React, { useState, useEffect, useCallback } from 'react';
import type { Product, Transaction } from './types';
import { MovementType } from './types';
import { INITIAL_PRODUCTS } from './constants';
import TransactionForm from './components/TransactionForm';
import InventoryTable from './components/InventoryTable';
import HistoryTable from './components/HistoryTable';

// Helper function to safely load state from LocalStorage
const loadStateFromStorage = () => {
  try {
    const storedProducts = localStorage.getItem('inventory_products');
    const storedHistory = localStorage.getItem('inventory_history');

    const products = storedProducts ? JSON.parse(storedProducts) : INITIAL_PRODUCTS;
    const history = storedHistory ? JSON.parse(storedHistory) : [];

    // Quick validation to prevent app crash if stored data is malformed
    if (!Array.isArray(products) || !Array.isArray(history)) {
        return { products: INITIAL_PRODUCTS, history: [] };
    }
    return { products, history };

  } catch (e) {
    console.error("Failed to load or parse from localStorage", e);
    // Fallback to initial state if there's an error
    return { products: INITIAL_PRODUCTS, history: [] };
  }
};


const App: React.FC = () => {
  // Initialize state directly and synchronously from localStorage for a stable first render
  const [products, setProducts] = useState<Product[]>(() => loadStateFromStorage().products);
  const [history, setHistory] = useState<Transaction[]>(() => loadStateFromStorage().history);
  const [error, setError] = useState<string | null>(null);

  // Save state to LocalStorage whenever products or history change
  useEffect(() => {
    try {
      localStorage.setItem('inventory_products', JSON.stringify(products));
      localStorage.setItem('inventory_history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [products, history]);
  
  const handleAddTransaction = useCallback((code: string, type: MovementType, quantity: number) => {
    setError(null);
    const productIndex = products.findIndex(p => p.code === code);
    if (productIndex === -1) {
      setError(`Producto con código ${code} no encontrado.`);
      return;
    }

    const updatedProducts = [...products];
    const product = { ...updatedProducts[productIndex] };
    let newTotal = product.total;

    if (type === MovementType.Entrada) {
      newTotal += quantity;
    } else { // Salida
      if (product.total < quantity) {
        setError(`No hay stock suficiente para la salida. Stock actual: ${product.total}.`);
        return;
      }
      newTotal -= quantity;
    }
    
    product.total = newTotal;
    updatedProducts[productIndex] = product;

    const newTransaction: Transaction = {
      date: new Date().toLocaleString('es-ES'),
      code: product.code,
      description: product.description,
      type,
      quantity,
      resultingBalance: newTotal,
    };

    setProducts(updatedProducts);
    setHistory(prevHistory => [newTransaction, ...prevHistory]);

  }, [products]);

  const downloadCSV = () => {
    if (history.length === 0) {
      alert("No hay movimientos para generar un reporte.");
      return;
    }

    const headers = ["Fecha", "Código", "Descripción", "Tipo", "Cantidad", "Saldo Resultante"];
    const csvContent = [
      headers.join(','),
      ...history.map(tx => [
        `"${tx.date}"`,
        tx.code,
        `"${tx.description}"`,
        tx.type,
        tx.quantity,
        tx.resultingBalance
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = "reporte_de_movimientos.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">
          Control de Inventario
        </h1>
        <p className="text-lg text-gray-600 mt-2">Frutos Tostados y Engomados</p>
      </header>

      <main className="space-y-8">
        <TransactionForm products={products} onAddTransaction={handleAddTransaction} error={error}/>
        <InventoryTable products={products} />
        
        <div className="flex justify-end">
            <button
              onClick={downloadCSV}
              className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ease-in-out flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L10 10.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v6.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Descargar Reporte de Movimientos
            </button>
        </div>

        <HistoryTable transactions={history} />
      </main>
      
      <footer className="text-center mt-12 text-gray-500">
        <p>&copy; {new Date().getFullYear()} Gestión de Inventario. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default App;
