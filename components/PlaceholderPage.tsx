import React from 'react';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-[rgb(var(--color-card-rgb))] rounded-lg shadow p-8 transition-colors">
      <h1 className="text-4xl font-bold text-[rgb(var(--color-text-rgb))]">{title}</h1>
      <p className="mt-4 text-lg text-[rgb(var(--color-text-muted-rgb))]">This page is under construction. Check back soon!</p>
    </div>
  );
};

export default PlaceholderPage;