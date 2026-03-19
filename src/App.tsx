/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Feed } from './pages/Feed';
import { Leis } from './pages/Leis';
import { Propostas } from './pages/Propostas';
import { Atividade } from './pages/Atividade';
import { LeiDetalhe } from './pages/LeiDetalhe';
import { PRDetalhe } from './pages/PRDetalhe';
import { Connect } from './pages/Connect';
import { SolicitarCidadania } from './pages/SolicitarCidadania';
import { Perfil } from './pages/Perfil';
import { NovaProposta } from './pages/NovaProposta';
import { NovoFork } from './pages/NovoFork';
import { BairroRepo } from './pages/BairroRepo';
import { MeuBairro } from './pages/MeuBairro';
import { useApp } from './context/AppProvider';

function HomeEntry() {
  const { currentAddress, currentCitizen, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-git-bg)] px-6 py-12 text-center text-sm text-[var(--color-git-muted)]">
        Carregando seu acesso ao GitLaw...
      </div>
    );
  }

  if (!currentAddress) {
    return <Navigate to="/connect" replace />;
  }

  if (!currentCitizen) {
    return <Navigate to="/cidadania/solicitar" replace />;
  }

  return <Feed />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/connect" element={<Connect />} />
        <Route path="/cidadania/solicitar" element={<SolicitarCidadania />} />
        <Route path="/propostas/nova" element={<NovaProposta />} />
        <Route path="/fork/novo" element={<NovoFork />} />
        <Route path="/leis/:id/fork" element={<NovoFork />} />
        <Route path="/bairros/:id" element={<BairroRepo />} />
        <Route path="/bairro/:id" element={<BairroRepo />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<HomeEntry />} />
          <Route path="meu-bairro" element={<MeuBairro />} />
          <Route path="leis" element={<Leis />} />
          <Route path="leis/:id" element={<LeiDetalhe />} />
          <Route path="propostas" element={<Propostas />} />
          <Route path="propostas/:id" element={<PRDetalhe />} />
          <Route path="propostas/:id/votar" element={<PRDetalhe />} />
          <Route path="pr/:id" element={<PRDetalhe />} />
          <Route path="atividade" element={<Atividade />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
