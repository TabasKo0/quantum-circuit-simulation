import './globals.css';

export const metadata = {
  title: 'Quantum Computing Simulator Suite',
  description: 'Visual quantum circuit simulation with a Python backend',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0b1020]">{children}</body>
    </html>
  );
}